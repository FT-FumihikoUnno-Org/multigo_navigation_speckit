from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='nav_goal',
            executable='nav_goal_node',
            name='nav_goal_node',
            parameters=[
                {"map_frame": "map"},
                {"camera_front_left_frame": "camera_front_left_frame"},
                {"camera_front_right_frame": "camera_front_right_frame"},
                {"desired_aruco_marker_id_left": 20},
                {"desired_aruco_marker_id_right": 21},
                {"aruco_distance_offset": -0.5},
                {"aruco_left_right_offset": -0.15},
                {"marker_topic_front_left": "/aruco_detect/markers_left"},
                {"marker_topic_front_right": "/aruco_detect/markers_right"},
            ],
            remappings=[
                ('goal_pose', 'goal_pose')
            ]
        )
    ])
