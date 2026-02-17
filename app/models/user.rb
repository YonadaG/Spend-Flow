class User < ApplicationRecord
  has_many :receipts, dependent: :destroy
  has_secure_password
  has_many :expense_transactions, dependent: :destroy
  has_many :budgets, dependent: :destroy
  has_many :categories, dependent: :destroy

  validates :email, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email address" }
  validates :name, presence: true
  validates :password, length: { minimum: 6 }, if: -> { password.present? }
end
