from launch import LaunchDescription
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():

    LENGTH_ROTATION_CENTER_SOLO = 0.0
    LENGTH_ROTATION_CENTER_DOCKING = 0.25
    LENGTH_ROTATION_CENTER_COMBINE_CHAIR = 0.5
    return LaunchDescription([
        Node(
            package='nav_control',
            executable='nav_control_node',
            name='nav_control_node',
            parameters=[
                {"input_topic": "cmd_vel_final"},
                {"output_topic": "cmd_vel"},
                {"mode_drive": "DOCKING"},
                {"LENGTH_ROTATION_CENTER_SOLO": LENGTH_ROTATION_CENTER_SOLO},
                {"LENGTH_ROTATION_CENTER_DOCKING": LENGTH_ROTATION_CENTER_DOCKING},
                {"LENGTH_ROTATION_CENTER_COMBINE_CHAIR": LENGTH_ROTATION_CENTER_COMBINE_CHAIR},
            ],
            remappings=[
                ]
        )
    ])


