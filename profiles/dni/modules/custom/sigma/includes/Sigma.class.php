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
  private $access_key;


  /**
   *
   */
  private function __construct() {
    $this->drupal_url = variable_get('sigma_drupal_url');
    $this->client_id = variable_get('sigma_client_id');
    $this->client_secret = variable_get('sigma_client_secret');
    $this->node_host = variable_get('sigma_node_host');
    $this->node_port = variable_get('sigma_node_port');
    $this->access_key = variable_get('sigma_access_key');
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
    if (!$this->node_port) {
      $messages[] = t('Node server port is not defined.');
    }
    if (!$this->access_key) {
      $messages[] = t('Access key is not defined.');
    }
    if (!$messages) {
      $args = array(
        DRUPAL_ROOT . '/' . drupal_get_path('module', 'sigma') . '/js/server/server.js',
        'drupal_url=' . $this->drupal_url,
        'client_id=' . $this->client_id,
        'client_secret=' . $this->client_secret,
        'port=' . $this->node_port,
        'access_key=' . $this->access_key,
      );
      $debug = variable_get('node_server_debug_mode', 0);
      $log_file = variable_get('node_server_log_file');
      if ($debug && $log_file) {
        $args[] = 'debug=1';
        $args[] = 'log_file=' . $log_file;
      }
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
