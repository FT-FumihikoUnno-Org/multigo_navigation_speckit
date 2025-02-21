from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    desired_aruco_marker_id_left = 20
    desired_aruco_marker_id_right = desired_aruco_marker_id_left + 1

    return LaunchDescription([
        Node(
                package='aruco_detect',
                executable='aruco_detect_node',
                name='aruco_detect_left_node',
                parameters=[
                    {"desired_aruco_marker_id": desired_aruco_marker_id_left},
                    {"marker_width": 0.05},
                    {"camera_topic": "/camera/color/image_raw_left"},
                    {"camera_info": "/camera/color/camera_info_left"}
                ],
                remappings=[
                    ('aruco_detect/markers', 'aruco_detect/markers_left')
                ]
            ),
        Node(
                package='aruco_detect',
                executable='aruco_detect_node',
                name='aruco_detect_right_node',
                parameters=[
                    {"desired_aruco_marker_id": desired_aruco_marker_id_right},
                    {"marker_width": 0.05},
                    {"camera_topic": "/camera/color/image_raw_right"},
                    {"camera_info": "/camera/color/camera_info_right"}
                ],
                remappings=[
                    ('aruco_detect/markers', 'aruco_detect/markers_right')
                ]
            ),

    ] 

    )
