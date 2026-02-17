class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2
      t.string :currency
      t.string :direction
      t.string :system_category
      t.string :user_category
      t.string :merchant_name
      t.string :institution
      t.string :transaction_type
      t.text :payment_reason
      t.datetime :occurred_at
      t.float :confidence_score
      t.text :raw_text

      t.timestamps
    end
  end
end
