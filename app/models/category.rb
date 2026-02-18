class Category < ApplicationRecord
  has_many :expense_transactions
  has_many :budgets
  belongs_to :user, optional: true

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, message: "already exists for this user" }
end
