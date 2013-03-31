<?php


/**
 * Form constructor for settings form.
 */
function sigma_settings_form() {
  $form = array();

  $form['instagram'] = array(
    '#type' => 'fieldset',
    '#title' => t('Instagram settings'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );

  $form['instagram']['client_id'] = array(
    '#type' => 'textfield',
    '#title' => t('Instagram Client ID'),
    '#default_value' => variable_get('sigma_client_id', ''),
    '#size' => 32,
    '#maxlength' => 32,
    '#required' => TRUE,
  );

  $form['instagram']['client_secret'] = array(
    '#type' => 'textfield',
    '#title' => t('Instagram Client Secret'),
    '#default_value' => variable_get('sigma_client_secret', ''),
    '#size' => 32,
    '#maxlength' => 32,
    '#required' => TRUE,
  );

  $form['instagram']['instagram_submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save Instagram Settings'),
  );

  $form['server'] = array(
    '#type' => 'fieldset',
    '#title' => t('Server settings'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );

  $form['server']['server_host'] = array(
    '#type' => 'item',
    '#title' => t('Node server host'),
    '#markup' => variable_get('sigma_server_host'),
  );

  $form['server']['server_port'] = array(
    '#type' => 'textfield',
    '#title' => t('Node server port'),
    '#default_value' => variable_get('sigma_server_port', 80),
    '#size' => 4,
    '#maxlength' => 4,
    '#required' => TRUE,
  );

  $form['server']['server_submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save Server Settings'),
  );

  $form['subs'] = array(
    '#type' => 'fieldset',
    '#title' => t('Subcriptions'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );

  $form['subs']['subs_list'] = array(
    '#markup' => sigma_settings_form_subscription_list(),
  );

  $form['subs']['subs_add'] = array(
    '#type' => 'button',
    '#value' => t('Add Subscription'),
  );

  $form['subs']['subs_new'] = array(
    '#type' => 'fieldset',
    '#title' => t('New Subscription'),
    '#collapsible' => FALSE,
    '#collapsed' => FALSE,
  );

  $form['subs']['subs_new']['subs_new_type'] = array(
    '#type' => 'item',
    '#title' => t('Subscription type'),
    '#markup' => t('Tag'),
  );

  $form['subs']['subs_new']['subs_new_object'] = array(
    '#type' => 'textfield',
    '#title' => t('Tag'),
  );

  $form['subs']['subs_new']['subs_new_create'] = array(
    '#type' => 'button',
    '#value' => t('Create'),
  );

  $form['subs']['subs_new']['subs_new_cancel'] = array(
    '#type' => 'button',
    '#value' => t('Cancel'),
  );

  $form += sigma_render_status();

  $form['server_start'] = array(
    '#type' => 'submit',
    '#value' => t('Start Server'),
  );

  $form['server_stop'] = array(
    '#type' => 'button',
    '#value' => t('Stop Server'),
  );

  sigma_prepare_js();
  ctools_add_js('sigma_settings.admin', 'sigma', 'js/client');
  ctools_add_css('sigma.admin', 'sigma', 'css');

  return $form;
}


/**
 * Form validation handler for sigma_node_server_form().
 */
function sigma_settings_form_validate($form, &$form_state) {
  foreach (array('client_id', 'client_secret') as $key) {
    if (!preg_match('/^[a-f0-9]{32}$/', trim(check_plain($form_state['values'][$key])))) {
      form_set_error($key, t('Invalid parameter.'));
    }
  }
  if (!is_int($form_state['values']['server_port']) && 0 >= $form_state['values']['server_port']) {
    form_set_error('server_port', t('Invalid port.'));
  }
}


/**
 * Form submission handler for sigma_settings_form().
 */
function sigma_settings_form_submit($form, &$form_state) {
  $data = $form_state['values'];
  switch ($data['op']) {
    case 'Save Instagram Settings':
      foreach (array('client_id', 'client_secret') as $key) {
        variable_set('sigma_' . $key, trim(check_plain($form_state['values'][$key])));
      }
      drupal_set_message(t('Settings were successfully updated. Node server should be restarted.'));
      break;

    case 'Save Server Settings':
      foreach (array('server_port') as $key) {
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
 * Renders subscription list table for settings page.
 */
function sigma_settings_form_subscription_list() {
  $vars = array(
    'header' => array(
      t('Subscription ID'),
      t('Type'),
      t('Tag'),
      t('Moderated'),
      t('Action'),
    ),
    'rows' => array(
      array('', '', '', '', l(t('Delete'), '', array('attributes' => array('class' => 'button'))))
    ),
    'attributes' => array('id' => 'subscription-list'),
  );
  $content = theme('table', $vars);

  return $content;
}


/**
 * Form constructor for clients form.
 */
function sigma_clients_form() {
  $form = array();

  $form += sigma_render_status();

  $form['clients'] = array(
    '#markup' => sigma_clients_form_client_list(),
  );

  sigma_prepare_js();
  ctools_add_js('sigma_clients.admin', 'sigma', 'js/client');
  ctools_add_css('sigma.admin', 'sigma', 'css');

  return $form;
}


/**
 * Renders client list table.
 */
function sigma_clients_form_client_list() {
  $vars = array(
    'header' => array(
      t('IP'),
      t('Group'),
      t('Path'),
      t('User Agent'),
      t('Subscriptions'),
    ),
    'rows' => array(
      array('', '', '', '', '')
    ),
    'attributes' => array('id' => 'client-list'),
  );
  $content = theme('table', $vars);

  return $content;
}


/**
 * Form constructor for moderation form.
 */
function sigma_moderation_form() {
  $form = array();

  $form += sigma_render_status();

  $form['subscriptions'] = array(
    '#markup' => sigma_moderation_form_subscription_list(),
  );

  sigma_prepare_js();
  ctools_add_js('sigma_moderation.admin', 'sigma', 'js/client');
  ctools_add_css('sigma.admin', 'sigma', 'css');

  return $form;
}


/**
 * Renders subscription list table for moderation page.
 */
function sigma_moderation_form_subscription_list() {
  $vars = array(
    'header' => array(
      t('Subscription ID'),
      t('Type'),
      t('Tag'),
      t('Moderated'),
      t('Action'),
    ),
    'rows' => array(
      array('', '', '', '', l(t('Moderate'), '', array('attributes' => array('class' => 'button'))))
    ),
    'attributes' => array('id' => 'subscription-list'),
  );
  $content = theme('table', $vars);

  return $content;
}
