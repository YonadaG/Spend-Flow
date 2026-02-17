
  class BudgetsController < ApplicationController
  before_action :authorize_request

  def create
    # Validate category exists
    if params[:category_id].present?
      category = Category.find_by(id: params[:category_id])
      unless category
        render json: { error: "Category not found" }, status: :not_found
        return
      end
    end

    budget = current_user.budgets.new(budget_params)

    if budget.save
      render json: budget, status: :created
    else
      render json: { errors: budget.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Error creating budget: #{e.message}")
    render json: { error: "An error occurred while creating the budget" }, status: :internal_server_error
  end

  def index
    budgets = current_user.budgets.includes(:category)

    render json: budgets.as_json(
      only: [:id, :month, :amount],
      include: { category: { only: [:id, :name] } }
    )
  rescue StandardError => e
    Rails.logger.error("Error fetching budgets: #{e.message}")
    render json: { error: "An error occurred while fetching budgets" }, status: :internal_server_error
  end

  private

  def budget_params
    params.permit(:category_id, :month, :amount)
  end
end


