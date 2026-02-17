class RenameTransactionsToExpenseTransactions < ActiveRecord::Migration[8.1]
  def change
    rename_table :transactions, :expense_transactions
  end
end
