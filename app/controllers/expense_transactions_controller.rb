class ExpenseTransactionsController < ApplicationController
  before_action :authorize_request
  before_action :set_expense_transaction, only: [:show, :update, :destroy], if: -> { action_name != 'create' && action_name != 'index' }

  # GET /expense_transactions
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
      only: [:id, :amount, :description, :created_at],
      include: { category: { only: [:id, :name] } }
    )
  }
rescue StandardError => e
  Rails.logger.error("Error in index: #{e.message}")
  render json: { error: "An error occurred while fetching transactions" }, status: :internal_server_error
end

  # GET /expense_transactions/:id
  def show
    render json: @expense_transaction
  end

  # POST /expense_transactions
  def create
    expense_transaction = @current_user.expense_transactions.new(expense_transaction_params)

    if expense_transaction.save
      render json: expense_transaction, status: :created
    else
      render json: { errors: expense_transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /expense_transactions/:id
  def update
    transaction = current_user.expense_transactions.find(params[:id])

    if update_category_if_needed(transaction) && transaction.update(transaction_params)
      render json: {
        message: "Transaction updated successfully",
        transaction: transaction.as_json(
          only: [:id, :amount, :description],
          include: { category: { only: [:id, :name] } }
        )
      }
    else
      render json: { errors: transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def transaction_params
    params.permit(:amount, :description)
  end

  # Allow updating category by category_id OR category_name
  def update_category_if_needed(transaction)
    if params[:category_id]
      category = Category.find_by(id: params[:category_id])
      return false unless category
      transaction.category = category
    elsif params[:category_name]
      category = Category.find_or_create_by(name: params[:category_name], user: current_user)
      transaction.category = category
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end
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

  # DELETE /expense_transactions/:id
  def destroy
    @expense_transaction.destroy
    head :no_content
  end

  private

  def set_expense_transaction
    @expense_transaction = @current_user.expense_transactions.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Transaction not found" }, status: :not_found
  end

  def expense_transaction_params
    params.permit(
      :user_id,
      :amount,
      :currency,
      :direction,
      :system_category,
      :user_category,
      :merchant_name,
      :institution,
      :transaction_type,
      :payment_reason,
      :occurred_at,
      :confidence_score,
      :raw_text
    )
  end
end

