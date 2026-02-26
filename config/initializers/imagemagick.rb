# Ensure ImageMagick is available in PATH for MiniMagick
# This is needed because ImageMagick may be installed after the shell session started
if Gem.win_platform?
  imagemagick_path = "C:/Program Files/ImageMagick-7.1.2-Q16-HDRI"
  if Dir.exist?(imagemagick_path) && !ENV['PATH'].include?(imagemagick_path)
    ENV['PATH'] = "#{imagemagick_path};#{ENV['PATH']}"
  end
end
