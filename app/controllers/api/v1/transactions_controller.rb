class Api::V1::TransactionsController < ApplicationController
  before_action :authorize_request
  before_action :set_transaction, only: [:show, :update, :destroy]

  # GET /api/v1/transactions
  def index
    transactions = current_user.expense_transactions.includes(:category)

    # Filter by category_id
    if params[:category_id].present?
      transactions = transactions.where(category_id: params[:category_id])
    end

    # Filter by start_date and end_date
    if params[:start_date].present? && params[:end_date].present?
      begin
        start_date = Date.parse(params[:start_date])
        end_date = Date.parse(params[:end_date])
        transactions = transactions.where(
          created_at: start_date..end_date
        )
      rescue ArgumentError
        render json: { error: "Invalid date format. Use YYYY-MM-DD" }, status: :bad_request
        return
      end
    end

    # Filter by month (format: 2026-02)
    if params[:month].present?
      begin
        date = Date.parse("#{params[:month]}-01")
        transactions = transactions.where(
          created_at: date.beginning_of_month..date.end_of_month
        )
      rescue ArgumentError
        render json: { error: "Invalid month format. Use YYYY-MM" }, status: :bad_request
        return
      end
    end

    # Filter by min_amount
    if params[:min_amount].present?
      transactions = transactions.where("amount >= ?", params[:min_amount])
    end

    # Filter by max_amount
    if params[:max_amount].present?
      transactions = transactions.where("amount <= ?", params[:max_amount])
    end

    transactions = transactions.order(created_at: :desc)
    page = params[:page].to_i <= 0 ? 1 : params[:page].to_i
    per_page = params[:per_page].to_i <= 0 ? 10 : params[:per_page].to_i

    total_count = transactions.count
    total_pages = (total_count / per_page.to_f).ceil

    transactions = transactions
                     .offset((page - 1) * per_page)
                     .limit(per_page)

    render json: {
      current_page: page,
      per_page: per_page,
      total_pages: total_pages,
      total_count: total_count,
      transactions: transactions.as_json(
        only: [
          :id, :amount, :description, :created_at, :category_id,
          :merchant_name, :payment_reason, :transaction_type, :direction,
          :currency, :invoice_no, :source, :status, :occurred_at,
          :payment_channel, :payer_name, :user_category
        ],
        include: { category: { only: [:id, :name] } }
      )
    }
  rescue StandardError => e
    Rails.logger.error("Error in index: #{e.message}")
    render json: { error: "An error occurred while fetching transactions" }, status: :internal_server_error
  end

  # GET /api/v1/transactions/:id
  def show
    render json: @transaction
  end

  # POST /api/v1/transactions
  def create
    # Extract transaction parameters from nested params
    transaction_data = extract_transaction_params
    
    transaction = current_user.expense_transactions.new(transaction_data)

    # Handle automatic category creation/assignment
    # Priority: explicit category_id > user_category from OCR > create from category_name
    if params.dig(:transaction, :category_id) || params[:category_id]
      category_id = params.dig(:transaction, :category_id) || params[:category_id]
      category = Category.find_by(id: category_id, user: current_user)
      transaction.category = category if category
    elsif transaction_data[:user_category].present?
      # Find or create category from OCR-detected category name
      category = Category.find_or_create_by(
        name: transaction_data[:user_category],
        user: current_user
      )
      transaction.category = category
    end

    # Handle receipt_image attachment if present
    if params.dig(:transaction, :receipt_image)
      transaction.receipt_image.attach(params[:transaction][:receipt_image])
    elsif params[:receipt_image]
      transaction.receipt_image.attach(params[:receipt_image])
    end

    if transaction.save
      render json: {
        message: "Transaction created successfully",
        transaction: transaction.as_json(
          only: [:id, :amount, :merchant_name, :user_category, :occurred_at, :created_at, :payment_reason, :currency, :invoice_no, :source],
          methods: [:receipt_url],
          include: { category: { only: [:id, :name] } }
        )
      }, status: :created
    else
      render json: { errors: transaction.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Error creating transaction: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { errors: ["Failed to create transaction: #{e.message}"] }, status: :internal_server_error
  end

  # PATCH /api/v1/transactions/:id
  def update
    transaction_data = extract_transaction_params

    if update_category_if_needed(@transaction) && @transaction.update(transaction_data)
      render json: {
        message: "Transaction updated successfully",
        transaction: @transaction.as_json(
          only: [:id, :amount, :description],
          include: { category: { only: [:id, :name] } }
        )
      }
    else
      render json: { errors: @transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/transactions/:id
  def destroy
    @transaction.destroy
    head :no_content
  end

  # GET /api/v1/transactions/summary
  def summary
    transactions = current_user.expense_transactions.includes(:category)

    # Optional month filter (format: 2026-02)
    if params[:month].present?
      begin
        date = Date.parse("#{params[:month]}-01")
        transactions = transactions.where(
          created_at: date.beginning_of_month..date.end_of_month
        )
      rescue ArgumentError
        render json: { error: "Invalid month format. Use YYYY-MM" }, status: :bad_request
        return
      end
    end

    total_spending = transactions.sum(:amount)
    total_count = transactions.count

    by_category = transactions
                    .group("categories.name")
                    .joins(:category)
                    .sum(:amount)

    render json: {
      total_spending: total_spending,
      total_transactions: total_count,
      by_category: by_category
    }
  rescue StandardError => e
    Rails.logger.error("Error in summary: #{e.message}")
    render json: { error: "An error occurred while generating summary" }, status: :internal_server_error
  end

  private

  def set_transaction
    @transaction = current_user.expense_transactions.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Transaction not found" }, status: :not_found
  end

  def extract_transaction_params
    if params[:transaction].present?
      params.require(:transaction).permit(
        :amount, :currency, :direction,
        :system_category, :user_category, :merchant_name,
        :institution, :transaction_type, :payment_reason,
        :occurred_at, :confidence_score, :raw_text,
        :invoice_no, :source, :payer_name, :payment_channel, :status
      )
    else
      params.permit(
        :amount, :currency, :direction,
        :system_category, :user_category, :merchant_name,
        :institution, :transaction_type, :payment_reason,
        :occurred_at, :confidence_score, :raw_text,
        :invoice_no, :source, :payer_name, :payment_channel, :status
      )
    end
  end

  # Allow updating category by category_id OR category_name
  def update_category_if_needed(transaction)
    if params[:category_id] || params.dig(:transaction, :category_id)
      category_id = params[:category_id] || params.dig(:transaction, :category_id)
      category = Category.find_by(id: category_id)
      return false unless category
      transaction.category = category
    elsif params[:category_name] || params.dig(:transaction, :category_name)
      category_name = params[:category_name] || params.dig(:transaction, :category_name)
      category = Category.find_or_create_by(name: category_name, user: current_user)
      transaction.category = category
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end
end
