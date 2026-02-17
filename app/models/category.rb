class Category < ApplicationRecord
  has_many :expense_transactions
  has_many :budgets
  belongs_to :user, optional: true
  belongs_to :parent, class_name: "Category", optional: true
  has_many :subcategories, class_name: "Category", foreign_key: "parent_id", dependent: :destroy

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, message: "already exists for this user" }
  validates :limit, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  
  # Default icon if none provided
  after_initialize :set_defaults, if: :new_record?

  def set_defaults
    self.icon ||= 'FaBoxOpen'
    self.limit ||= 0.0
  end
end
