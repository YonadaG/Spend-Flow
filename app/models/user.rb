class User < ApplicationRecord
  has_many :receipts, dependent: :destroy
  has_secure_password
  has_many :expense_transactions, dependent: :destroy
  has_many :budgets, dependent: :destroy
  has_many :categories, dependent: :destroy

  after_create :create_default_categories

  validates :email, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email address" }
  validates :name, presence: true
  private

  def create_default_categories
    default_categories = ["Food", "Hospital", "Transfer", "Utilities", "Fuel", "Other"]
    default_categories.each do |category_name|
      categories.find_or_create_by(name: category_name)
    end
  end
end
