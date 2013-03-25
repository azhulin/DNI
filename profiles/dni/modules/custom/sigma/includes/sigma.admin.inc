<?php


/**
 * Form constructor for Node.js server settings form.
 */
function sigma_node_server_form() {
  if (!variable_get('sigma_client_id') || !variable_get('sigma_client_secret')) {
    drupal_goto('admin/config/services/sigma/settings');
  }

  global $drupal_hash_salt;

  $form = array();

  $form['settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('Server settings'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );

  $form['settings']['node_host'] = array(
    '#type' => 'item',
    '#title' => t('Node server host'),
    '#markup' => variable_get('sigma_node_host'),
  );

  $form['settings']['node_port'] = array(
    '#type' => 'textfield',
    '#title' => t('Node server port'),
    '#default_value' => variable_get('sigma_node_port', 80),
    '#size' => 4,
    '#maxlength' => 4,
    '#required' => TRUE,
  );

  $form['settings']['access_key'] = array(
    '#type' => 'textfield',
    '#title' => t('Access key'),
    '#description' => t('Access key is used to generate access tokens'
        . ' needed for secure communication with Node server.'),
    '#default_value' => variable_get('sigma_access_key', md5($drupal_hash_salt)),
    '#size' => 32,
    '#maxlength' => 32,
    '#required' => TRUE,
  );

  $form['settings']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
  );

  $form['status'] = array(
    '#type' => 'item',
    '#title' => 'Server status',
    '#markup' => '<span class="server-status server-status-checking">' . t('Checking...') . '</span>'
      . '<span class="server-status server-status-on">' . t('Online') . '</span>'
      . '<span class="server-status server-status-off">' . t('Offline') . '</span>',
  );

  $form['node_start'] = array(
    '#type' => 'submit',
    '#value' => t('Start Server'),
  );

  $form['node_stop'] = array(
    '#type' => 'submit',
    '#value' => t('Stop Server'),
  );

  $form['#attached']['css'] = array(
    drupal_get_path('module', 'sigma') . '/css/sigma_admin.css',
  );

  $form['#attached']['js'] = array(
    drupal_get_path('module', 'sigma') . '/js/client/sigma.js',
    drupal_get_path('module', 'sigma') . '/js/client/sigma_admin.js',
  );

  $sigma = Sigma::getInstance();
  $sigma->send_node_server_url();

  return $form;
}


/**
 * Form validation handler for sigma_node_server_form().
 */
function sigma_node_server_form_validate($form, &$form_state) {
  if (!is_int($form_state['values']['node_port'])
      && 0 >= $form_state['values']['node_port']) {
    form_set_error('node_port', t('Invalid port.'));
  }
}


/**
 * Form submission handler for sigma_settings_form().
 */
function sigma_node_server_form_submit($form, &$form_state) {
  @file_put_contents('D:/log.txt',date('m-d-y H:i:s').' '.basename(__FILE__).':'.__LINE__.">\n".print_r($form_state['values'],1)."\n",FILE_APPEND);

  $data = $form_state['values'];
  switch ($data['op']) {
    case 'Save':
      foreach (array('node_port', 'access_key') as $key) {
        variable_set('sigma_' . $key, trim(check_plain($form_state['values'][$key])));
      }
      drupal_set_message(t('Settings were successfully updated. Node server should be restarted.'));
      break;

    case 'Start Server':
      $sigma = Sigma::getInstance();
      $sigma->start_node_server();
      break;
  }



}


/**
 * Form constructor for Sigma settings form.
 */
function sigma_settings_form() {
  $form = array();

  $form['client_id'] = array(
    '#type' => 'textfield',
    '#title' => t('Instagram Client ID'),
    '#default_value' => variable_get('sigma_client_id', ''),
    '#size' => 32,
    '#maxlength' => 32,
    '#required' => TRUE,
  );

  $form['client_secret'] = array(
    '#type' => 'textfield',
    '#title' => t('Instagram Client Secret'),
    '#default_value' => variable_get('sigma_client_secret', ''),
    '#size' => 32,
    '#maxlength' => 32,
    '#required' => TRUE,
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
  );

  return $form;
}


/**
 * Form validation handler for sigma_settings_form().
 */
function sigma_settings_form_validate($form, &$form_state) {
  foreach (array('client_id', 'client_secret') as $key) {
    if (!preg_match('/^[a-f0-9]{32}$/', trim(check_plain($form_state['values'][$key])))) {
      form_set_error($key, t('Invalid parameter.'));
    }
  }
}


/**
 * Form submission handler for sigma_settings_form().
 */
function sigma_settings_form_submit($form, &$form_state) {
  foreach (array('client_id', 'client_secret') as $key) {
    variable_set('sigma_' . $key, trim(check_plain($form_state['values'][$key])));
  }
  $form_state['redirect'] = 'admin/config/services/sigma';
  drupal_set_message(t('Settings were successfully updated. Node server should be restarted.'));
}
