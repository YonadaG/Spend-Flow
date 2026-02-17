class AddOcrFieldsToExpenseTransactions < ActiveRecord::Migration[8.1]
  def change
    add_column :expense_transactions, :invoice_no, :string
    add_column :expense_transactions, :source, :string
    add_column :expense_transactions, :payer_name, :string
    add_column :expense_transactions, :payment_channel, :string
    add_column :expense_transactions, :status, :string
    add_reference :expense_transactions, :category, foreign_key: true, index: true
    
    # Add indexes for commonly queried fields
    add_index :expense_transactions, :invoice_no
    add_index :expense_transactions, :status
  end
end
