class Api::V1::AuthController < ApplicationController
  skip_before_action :authorize_request, only: [:login, :signup]

  def signup
    user = User.new(user_params)

    if user.save
      token = JsonWebToken.encode(user_id: user.id)
      time = Time.now + 24.hours.to_i
      render json: { 
        message: "User created successfully",
        token: token,
        exp: time.strftime("%m-%d-%Y %H:%M"),
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    # Support both nested and flat params
    email = params.dig(:user, :email) || params[:email]
    password = params.dig(:user, :password) || params[:password]

    user = User.find_by(email: email)

    if user&.authenticate(password)
      token = JsonWebToken.encode(user_id: user.id)
      time = Time.now + 24.hours.to_i
      render json: { 
        token: token, 
        exp: time.strftime("%m-%d-%Y %H:%M"),
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def logout
    # With JWT, logout is handled client-side by removing the token
    # But we can still provide an endpoint for consistency
    render json: { message: "Logged out successfully" }, status: :ok
  end

  def me
    render json: {
      id: current_user.id,
      email: current_user.email,
      name: current_user.name
    }, status: :ok
  end

  def update
    if current_user.update(user_params)
      render json: {
        message: "Profile updated successfully",
        user: {
          id: current_user.id,
          email: current_user.email,
          name: current_user.name
        }
      }, status: :ok
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    # Support both nested user params and flat params
    if params[:user].present?
      params.require(:user).permit(:email, :password, :password_confirmation, :name)
    else
      params.permit(:email, :password, :password_confirmation, :name)
    end
  end
end
