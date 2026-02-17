class Budget < ApplicationRecord
  belongs_to :user
  belongs_to :category

  validates :month, presence: true
  validates :month, format: { with: /\A\d{4}-\d{2}\z/, message: "must be in YYYY-MM format" }
  validates :amount, presence: true
  validates :amount, numericality: { greater_than: 0, message: "must be greater than 0" }
  validates :user_id, uniqueness: { scope: [:category_id, :month], message: "already has a budget for this category and month" }
end
