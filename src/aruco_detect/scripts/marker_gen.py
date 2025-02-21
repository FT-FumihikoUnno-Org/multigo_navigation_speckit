import cv2
import cv2.aruco as aruco

# Define the marker dictionary (6x6, 250 markers)
d = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)

# Marker size in mm (100 mm), conversion to pixels at 300 DPI
marker_size_mm = 100  # in millimeters
dpi = 300  # dots per inch
marker_size_pixels = int(marker_size_mm * dpi / 25.4)  # Convert mm to pixels

# Generate the marker with ID 20
marker_id = 25
marker_image = aruco.drawMarker(d, marker_id, marker_size_pixels)

# Save the marker to a PNG file
cv2.imwrite('aruco-6x6-' + str(marker_id) + '.png', marker_image)
