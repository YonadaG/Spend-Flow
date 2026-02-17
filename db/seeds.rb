# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Seed default categories for all users
DEFAULT_CATEGORIES = ["Food", "Hospital", "Transfer", "Utilities", "Fuel", "Other"]

puts "Seeding default categories..."

User.find_each do |user|
  DEFAULT_CATEGORIES.each do |category_name|
    category = user.categories.find_or_create_by(name: category_name)
    puts "  - Created/Found '#{category_name}' for user #{user.email}"
  end
end

puts "Default categories seeded successfully!"
