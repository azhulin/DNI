<?php


/**
 *
 */
class Sigma {

  private static $instance;
  private $drupal_url;
  private $client_id;
  private $client_secret;
  private $node_host;
  private $node_port;


  /**
   *
   */
  private function __construct() {
    global $base_root;

    $this->drupal_url = $base_root;
    $this->client_id = variable_get('sigma_client_id');
    $this->client_secret = variable_get('sigma_client_secret');
    $this->node_host = preg_replace(array('/^https?:\/\//', '/:[0-9]*$/'), '', $base_root);
    $this->node_port = variable_get('sigma_server_port');
  }


  /**
   *
   */
  public static function getInstance() {
    if (empty(self::$instance)) {
      self::$instance = new Sigma();
    }
    return self::$instance;
  }


  /**
   *
   */
  public function send_node_server_url() {
    if ($this->node_host && $this->node_port) {
      $settings = array(
        'host' => 'http://' . $this->node_host . ':' . $this->node_port . '/',
      );
      drupal_add_js(array('sigma' => $settings), 'setting');
      return TRUE;
    }
    return FALSE;
  }


  /**
   *
   */
  public function start_node_server() {
    $messages = array();
    if (!$this->drupal_url) {
      $messages[] = t('Drupal URL is not defined.');
    }
    if (!$this->client_id) {
      $messages[] = t('Client ID is not defined.');
    }
    if (!$this->client_secret) {
      $messages[] = t('Client Secret is not defined.');
    }
    if (!$this->node_host) {
      $messages[] = t('Node server host is not defined.');
    }
    if (!$this->node_port) {
      $messages[] = t('Node server port is not defined.');
    }
    if (!$messages) {
      $args = array(
        DRUPAL_ROOT . '/' . drupal_get_path('module', 'sigma') . '/js/server/server.js',
        'drupal_url=' . $this->drupal_url,
        'client_id=' . $this->client_id,
        'client_secret=' . $this->client_secret,
        'host=' . $this->node_host,
        'port=' . $this->node_port,
      );
      foreach ($args as &$arg) {
        $arg = escapeshellarg($arg);
      }
      pclose(popen('start "a" "node" ' . implode(' ', $args), 'r'));
    }
    else {
      foreach ($messages as $message) {
        drupal_set_message($message, 'warning');
      }
    }
  }

}
