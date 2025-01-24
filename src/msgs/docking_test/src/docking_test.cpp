#include <memory>
#include <thread>
#include "rclcpp/rclcpp.hpp"
#include "rclcpp_action/rclcpp_action.hpp"
#include "nav_interface/action/docking.hpp"

class DockingTest : public rclcpp::Node
{
public:
  using Docking = nav_interface::action::Docking;
  using GoalHandleDocking = rclcpp_action::ServerGoalHandle<Docking>;

  explicit DockingTest(const rclcpp::NodeOptions & options = rclcpp::NodeOptions())
  : Node("docking_test", options)
  {
    using namespace std::placeholders;

    RCLCPP_INFO(this->get_logger(), "Docking test node has been started");

    this->docking_action_server_ = rclcpp_action::create_server<Docking>(
      this,
      "docking_action",
      std::bind(&DockingTest::handle_goal, this, _1, _2),
      std::bind(&DockingTest::handle_cancel, this, _1),
      std::bind(&DockingTest::handle_accepted, this, _1));
  }

private:
  rclcpp_action::Server<Docking>::SharedPtr docking_action_server_;

  rclcpp_action::GoalResponse handle_goal(
    const rclcpp_action::GoalUUID & uuid,
    std::shared_ptr<const Docking::Goal> goal)
  {
    RCLCPP_INFO(this->get_logger(), "Received docking request: %s", goal->dock ? "True" : "False");
    (void)uuid;
    return rclcpp_action::GoalResponse::ACCEPT_AND_EXECUTE;
  }

  rclcpp_action::CancelResponse handle_cancel(
    const std::shared_ptr<GoalHandleDocking> goal_handle)
  {
    RCLCPP_INFO(this->get_logger(), "Received request to cancel docking");
    (void)goal_handle;
    return rclcpp_action::CancelResponse::ACCEPT;
  }

  void handle_accepted(const std::shared_ptr<GoalHandleDocking> goal_handle)
  {
    using namespace std::placeholders;
    std::thread{std::bind(&DockingTest::execute, this, _1), goal_handle}.detach();
  }

  void execute(const std::shared_ptr<GoalHandleDocking> goal_handle)
  {
    RCLCPP_INFO(this->get_logger(), "Executing docking sequence");
    rclcpp::Rate loop_rate(1);
    auto feedback = std::make_shared<Docking::Feedback>();
    auto result = std::make_shared<Docking::Result>();

    double remaining_distance = 8.0;  // Example starting distance

    while (remaining_distance > 0.0 && rclcpp::ok()) {
      if (goal_handle->is_canceling()) {
        result->success = false;
        goal_handle->canceled(result);
        RCLCPP_INFO(this->get_logger(), "Docking goal canceled");
        return;
      }

      remaining_distance -= 1.0;  // Example decrement
      feedback->remaining_distance = remaining_distance;

      goal_handle->publish_feedback(feedback);
      RCLCPP_INFO(this->get_logger(), "Remaining distance: %.2f", feedback->remaining_distance);

      loop_rate.sleep();
    }

    if (rclcpp::ok()) {
      result->success = true;
      goal_handle->succeed(result);
      RCLCPP_INFO(this->get_logger(), "Docking successful");
    }
  }
};

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  auto node = std::make_shared<DockingTest>();
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}
