<?php

class Sigma {

  private static $instance;
  private $client_id;
  private $client_secret;
  private $node_host;
  private $node_port;
  private $access_key;


  private function __construct() {
    $this->client_id = variable_get('sigma_client_id');
    $this->client_secret = variable_get('sigma_client_secret');
    $this->node_host = variable_get('sigma_node_host');
    $this->node_port = variable_get('sigma_node_port');
    $this->access_key = variable_get('sigma_access_key');
  }


  public static function getInstance() {
    if (empty(self::$instance)) {
      self::$instance = new Sigma();
    }

    return self::$instance;
  }


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


  public function start_node_server() {
    $command = 'node ' . DRUPAL_ROOT . '/' . drupal_get_path('module', 'sigma') . '/js/server/server.js';
    //@file_put_contents('D:/log.txt',date('m-d-y H:i:s').' '.basename(__FILE__).':'.__LINE__.">\n".print_r($command,1)."\n",FILE_APPEND);
    //exec_background($command);
  }

  private function exec_background($command) {
    if (0 === strpos(php_uname(), 'Windows')) {
      pclose(popen('start /B ' . $command, 'r'));
    }
    else {
      exec($command . ' > /dev/null &') ;
    }
  }



}
