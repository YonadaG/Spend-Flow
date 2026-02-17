class AddPerformanceIndexes < ActiveRecord::Migration[8.1]
  def change
    # Add indexes for frequently queried columns
    add_index :users, :email, unique: true unless index_exists?(:users, :email)
    add_index :expense_transactions, :occurred_at unless index_exists?(:expense_transactions, :occurred_at)
    add_index :expense_transactions, :created_at unless index_exists?(:expense_transactions, :created_at)
    add_index :receipts, :processing_status unless index_exists?(:receipts, :processing_status)
    add_index :budgets, :month unless index_exists?(:budgets, :month)
    
    # Add composite indexes for common query patterns
    add_index :budgets, [:user_id, :category_id, :month], unique: true, name: "index_budgets_on_user_category_month" unless index_exists?(:budgets, [:user_id, :category_id, :month], name: "index_budgets_on_user_category_month")
    add_index :expense_transactions, [:user_id, :created_at], name: "index_expense_transactions_on_user_and_created_at" unless index_exists?(:expense_transactions, [:user_id, :created_at], name: "index_expense_transactions_on_user_and_created_at")
    
    # Add index for category lookup by name (case-insensitive)
    add_index :categories, :name unless index_exists?(:categories, :name)
    add_index :categories, [:user_id, :name], unique: true, name: "index_categories_on_user_and_name" unless index_exists?(:categories, [:user_id, :name], name: "index_categories_on_user_and_name")
  end
end
