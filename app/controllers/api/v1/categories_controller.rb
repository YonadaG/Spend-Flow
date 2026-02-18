class Api::V1::CategoriesController < ApplicationController
  before_action :authorize_request

  # GET /api/v1/categories
  def index
    categories = current_user.categories.order(:name)

    # Return array of categories with basic info
    render json: categories.map { |category|
      {
        id: category.id,
        name: category.name,
        description: category.description
      }
    }
  rescue StandardError => e
    Rails.logger.error("Error in categories index: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { error: "An error occurred while fetching categories" }, status: :internal_server_error
  end

  # POST /api/v1/categories
  def create
    category = current_user.categories.new(category_params)
    
    if category.save
      render json: {
        id: category.id,
        name: category.name,
        message: "Category created successfully"
      }, status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Error creating category: #{e.message}")
    render json: { error: "An error occurred while creating the category" }, status: :internal_server_error
  end

  # PATCH/PUT /api/v1/categories/:id
  def update
    category = current_user.categories.find(params[:id])
    
    if category.update(category_params)
      render json: {
        id: category.id,
        name: category.name,
        message: "Category updated successfully"
      }
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Category not found" }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Error updating category: #{e.message}")
    render json: { error: "An error occurred while updating the category" }, status: :internal_server_error
  end

  # DELETE /api/v1/categories/:id
  def destroy
    category = current_user.categories.find(params[:id])
    category.destroy
    
    render json: { message: "Category deleted successfully" }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Category not found" }, status: :not_found
  rescue StandardError => e
    Rails.logger.error("Error deleting category: #{e.message}")
    render json: { error: "An error occurred while deleting the category" }, status: :internal_server_error
  end

  private

  def category_params
    params.require(:category).permit(:name, :description)
  end
end
