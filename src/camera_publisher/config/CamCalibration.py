import numpy as np
import cv2
import os  # to make folder
import pickle
import yaml

def main():
    # Define variables
    CHESSBOARD_SIZE = (9, 6)  # Number of inner corners per a chessboard row and column

    # Camera settings (800x600,1280x720,1600x1200,1920x1080)
    width = 1280
    height = 720
    imgNum = 20  # Number of images to take for calibration

    # Termination criteria (from example, no idea what it does)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

    # Prepare object points, like (0,0,0), (1,0,0), (2,0,0) ....,(6,5,0) (chess board size essentially)
    objp = np.zeros((CHESSBOARD_SIZE[0] * CHESSBOARD_SIZE[1], 3), np.float32)
    objp[:, :2] = np.mgrid[0:CHESSBOARD_SIZE[0], 0:CHESSBOARD_SIZE[1]].T.reshape(-1, 2)

    # Arrays to store object points and image points from all the images.
    objpoints = []  # 3D points in real-world space
    imgpoints = []  # 2D points in image plane

    # Create a directory to save captured images
    output_dir = "Saved_Images"
    os.makedirs(output_dir, exist_ok=True)

    # Capture images from the webcam
    cap = cv2.VideoCapture(4)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

    print("'s' to save an image. 'q' to quit")

    saved_images = 0
    while True:
        ret, frame = cap.read()  # Camera data
        if not ret:
            print("Failed to grab frame. Exiting...")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # Image processing to gray scale
        ret, corners = cv2.findChessboardCorners(gray, CHESSBOARD_SIZE, None)

        if ret:
            cv2.drawChessboardCorners(frame, CHESSBOARD_SIZE, corners, ret)

        cv2.imshow("Calibration", frame)

        key = cv2.waitKey(1)
        if key == ord('s') and ret and saved_images < imgNum:  # Pressing 's' to save an image and save point values
            objpoints.append(objp)
            corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
            imgpoints.append(corners2)

            image_path = os.path.join(output_dir, f"image_{saved_images + 1}.jpg")
            cv2.imwrite(image_path, frame)
            saved_images += 1
            print(f"Saved image {saved_images}/{imgNum}")

        elif key == ord('q') or saved_images == imgNum:
            break

    cap.release()
    cv2.destroyAllWindows()

    # Perform camera calibration
    if len(objpoints) >= imgNum:
        print("...")
        ret, cameraMatrix, distCoeffs, rvecs, tvecs = cv2.calibrateCamera(
            objpoints, imgpoints, gray.shape[::-1], None, None
        )

        if ret:
            print("Camera Matrix:\n", cameraMatrix)
            print("Distortion Coefficients:\n", distCoeffs)
        else:
            print("Camera calibration failed.")

    # Save calibration data in a pickle file
    calib_data = (cameraMatrix, distCoeffs, rvecs, tvecs)
    with open('calib.pckl', 'wb') as f:
        pickle.dump(calib_data, f)
        print("Calibration data saved as calib.pckl")

    # Save calibration data in a yaml file for ROS compatibility
    camera_info = {
        "camera_matrix": {
            "rows": 3,
            "cols": 3,
            "data": cameraMatrix.flatten().tolist()
        },
        "distortion_coefficients": {
            "rows": 1,
            "cols": 5,
            "data": distCoeffs.flatten().tolist()
        },
        "image_width": width,
        "image_height": height,
        "camera_name": "usb_cam",
        "frame_id": "camera_front_left_frame"
    }

    with open('calib.yaml', 'w') as yaml_file:
        yaml.dump(camera_info, yaml_file, default_flow_style=False)
        print("Calibration data saved as calib.yaml")

if __name__ == "__main__":
    main()
