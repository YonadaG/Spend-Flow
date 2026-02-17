class CreateReceipts < ActiveRecord::Migration[8.1]
  def change
    create_table :receipts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :expense_transaction, null: false, foreign_key: true
      t.string :image_url
      t.text :ocr_text
      t.string :ocr_provider
      t.string :processing_status

      t.timestamps
    end
  end
end
