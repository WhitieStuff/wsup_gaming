<?php

namespace nizogor;

use Workerman\Worker;

require_once __DIR__ . '/vendor/autoload.php';

$context = [
  'ssl' => [
    'local_cert'  => '/etc/letsencrypt/live/wsup.whitie.ru/cert.pem',
    'local_pk'    => '/etc/letsencrypt/live/wsup.whitie.ru/privkey.pem',
    'verify_peer' => false,
  ]
];

$ws_worker = new Worker('websocket://0.0.0.0:9002', $context);
$ws_worker->transport = 'ssl';

$ws_worker->onConnect = function ($connection) {
  echo "New connection\n";
};

$ws_worker->onMessage = function ($connection, $data) {
  echo "Message received: $data\n";
};

$ws_worker->onClose = function ($connection) {
  echo "Connection closed\n";
};

$ws_worker->onWorkerStart = function () {
  echo "Worker started\n";
  start_new_game();
};

/**
 * Broadcasts a given message to all WSS clients.
 * @param {array} body Body of the message.
 */
function broadcast($body = [])
{
  $message = json_encode($body);
  global $ws_worker;
  foreach ($ws_worker->connections as $connection) {
    $connection->send($message);
  }
};

/**
 * Iteration of one round.
 */
class RocketLaunch
{

  public $launch_states = [
    "close" => "close",
    "mid" => "mid",
    "far" => "far",
    "heating" => "heating",
    "launch" => "launch",
    "takeoff" => "takeoff"
  ];
  /** Countdown duration in seconds. */
  public $launch_countdown = 10;

  /**
   * State of current flight.
   *
   * **0** - flying;
   * **1** - blown.
   */
  public $flight_state = 0;
  /** Duration of the flight. Generated in **start_flight()** */
  public $flight_duration = null;

  /** Current state of the cooldown.
   *
   * **0** - not cooling down;
   * **1** - cooling down.
   */
  public $cooldown_state = 0;
  /** Duration of the cooldown in seconds. */
  public $cooldown_duration = 4;

  /**
   * Start the contdown.
   *
   * Calls **change_state()** once a second.
   */
  function __construct()
  {
    echo "Countdown started\n";
    for ($i = $this->launch_countdown; $i >= 0; $i--) {
      $this->change_state($i);
    }
  }

  /**
   * Changes and broadcasts the state of the countdown.
   *
   * Calls **start_flight()** after the countdown.
   */
  function change_state($count)
  {
    echo "Countdown: $count\n";
    switch ($count) {
      case 10:
      case 9:
        $this->send_countdown_state($this->launch_states["close"]);
        sleep(1);
        break;
      case 8:
      case 7:
        $this->send_countdown_state($this->launch_states["mid"]);
        sleep(1);
        break;
      case 6:
      case 5:
        $this->send_countdown_state($this->launch_states["far"]);
        sleep(1);
        break;
      case 4:
      case 3:
      case 2:
      case 1:
        $this->send_countdown_state($this->launch_states["launch"]);
        sleep(1);
        break;
      case 0:
        $this->send_countdown_state($this->launch_states["takeoff"]);
        $this->start_flight();
        break;
    }
  }

  private function send_countdown_state($state = '')
  {
    $message = [
      "type" => "game_state",
      "launch_countdown" => $this->launch_countdown,
      "game_state" => $state
    ];
    broadcast($message);
  }

  /**
   * Starts the flight for generated duration.
   *
   * Calls **blow_rocket()** after that.
   */
  private function start_flight()
  {
    $this->flight_duration = $this->generate_duration();
    echo "Flight starts: $this->flight_duration ms\n";

    usleep($this->flight_duration * 1000);

    $this->blow_rocket();
  }

  /**
   * Blows the rocket.
   *
   * Calls **start_cooldown()** after the blow.
   */
  private function blow_rocket()
  {
    $this->flight_state = 1;
    echo "Rocket blows\n";

    broadcast(
      [
        "type" => "game_state",
        "game_state" => "blow"
      ]
    );
    $this->start_cooldown();
  }

  /**
   * Starts cooldown after the rocket blows.
   *
   * Calls **finish_cooldown()** after the cooldown.
   */
  private function start_cooldown()
  {
    echo "Cooldown starts\n";
    $this->cooldown_state = 1;
    broadcast([
      "type" => "game_state",
      "game_state" => "cooldown"
    ]);
    sleep(1);
    $this->finish_cooldown();
  }

  /**
   * Finishes cooldown and starts a new game.
   *
   * Calls global **start_new_game()**.
   */
  private function finish_cooldown()
  {
    echo "Cooldown ends. Game finished\n";
    $this->cooldown_state = 0;
    broadcast([
      "type" => "game_finish"
    ]);
    start_new_game();
  }

  // Service methods:

  /**
   * Generates duration of the flight until blow.
   * @returns {float} Duration of the fligt.
   */
  private function generate_duration()
  {
    $random = rand(0, 4000);
    $random += rand(0, 10) > 5 ? rand(0, 4000) : 0;
    $random += rand(0, 10) > 5 ? rand(0, 4000) : 0;
    $random += rand(0, 10) > 5 ? rand(0, 4000) : 0;
    $random += rand(0, 10) > 9 ? rand(0, 8000) : 0;

    return $random;
  }
}

// class Game {
//   public static $rocketLaunch;

//   function __construct()
//   {
//     self::start_new_game();
//   }

//   static function start_new_game() {
//     self::$rocketLaunch = new RocketLaunch();
//     echo "New game started\n";
//     broadcast([
//       "type" => "game_start"
//     ]);
//   }
// }

// $game = new Game();
$rocketLaunch = null;

function start_new_game()
{
  echo "New game started\n";
  global $rocketLaunch;
  $rocketLaunch = new RocketLaunch();
};

// Run worker
Worker::runAll();
