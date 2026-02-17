class AddOcrTextToReceipts < ActiveRecord::Migration[8.1]
  def change
  unless column_exists?(:receipts, :ocr_text)
      add_column :receipts, :ocr_text, :text
  end
  end
end
