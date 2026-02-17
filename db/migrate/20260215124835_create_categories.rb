class CreateCategories < ActiveRecord::Migration[8.1]
  def change
      create_table :categories do |t|
      t.string :name
      t.text :description
      t.references :user, foreign_key: true  # This references users table

      t.timestamps
    end
  end
end
