<?php

/**
 * @file
 * The PHP page that serves all page requests on a Drupal installation.
 *
 * The routines here dispatch control to the appropriate handler, which then
 * prints the appropriate page.
 *
 * All Drupal code is released under the GNU General Public License.
 * See COPYRIGHT.txt and LICENSE.txt.
 */
/**
 * Root directory of Drupal installation.
 */
define('DRUPAL_ROOT', getcwd());
require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);


/* $response = drupal_http_request(/* 'http://dni-node.no-ip.org/test' *'http://109.104.174.224:8081/test', array(
  'method' => 'POST',
  'data' => http_build_query(array('test' => 'test')), // see comments below - you may need to change this
  'headers' => array('Content-Type' => 'application/x-www-form-urlencoded'),
  ));
  @file_put_contents('D:/log.txt', date('m-d-y H:i:s') . ' ' . basename(__FILE__) . ':' . __LINE__ . ">\n" . print_r($response, 1) . "\n", FILE_APPEND); */


/*$command = 'node C:/wamp/www/profiles/dni/modules/custom/sigma/js/node/server.node.js';
function exec_bg($command) {
  if (0 === strpos(php_uname(), 'Windows')) {
    pclose(popen('start /B ' . $command, 'r'));
  }
  else {
    exec($command . ' > /dev/null &') ;
  }
}
exec_bg($command);
@file_put_contents('D:/log.txt', date('m-d-y H:i:s') . ' ' . basename(__FILE__) . ':' . __LINE__ . ">\n" . print_r('Done', 1) . "\n", FILE_APPEND);
*/


menu_execute_active_handler();
