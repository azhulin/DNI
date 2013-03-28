<?php


/**
 * Plugins are described by creating a $plugin array which will be used
 * by the system that includes this file.
 */
$plugin = array(
  'title' => t('Instagram'),
  'description' => t('Instagram widget'),
  'single' => TRUE,
  'content_types' => array('ig_widget'),
  'render callback' => 'sigma_ig_widget_content_type_render',
  'edit form' => 'sigma_ig_widget_content_type_edit_form',
  'category' => array(t('Widgets'), 0),
  'icon' => 'ig_widget.png',
  'admin info' => 'sigma_ig_widget_content_type_admin_info',
);


/**
 * Callback to provide administrative info.
 */
function sigma_ig_widget_content_type_admin_info($subtype, $conf) {
  $block = new stdClass();
  $block->title = t('Info');
  $block->content = '<ul><li>' . t('Subscription ID') . ': ' . $conf['id']
    . '</li><li>' . t('Type') . ': ' . $conf['type']
    . '</li><li>' . t('Object') . ': ' . $conf['object'] . '</li></ul>';

  return $block;
}


/**
 * Output function for this content type.
 */
function sigma_ig_widget_content_type_render($subtype, $conf) {
  $block = new stdClass();
  $block->title = '';
  $block->content = '<div></div>';

  return $block;
}


/**
 * Returns an edit form for content type.
 */
function sigma_ig_widget_content_type_edit_form($form, &$form_state) {
  $conf = $form_state['conf'];

  $form['wrapper'] = array(
    '#type' => 'fieldset',
    '#title' => t('Wrapper'),
  );

  $form['wrapper']['id'] = array(
    '#type' => 'textfield',
    '#title' => t('ID'),
    '#default_value' => isset($conf['id']) ? $conf['id'] : '',
    '#required' => TRUE,
  );

  $form['wrapper']['type'] = array(
    '#type' => 'textfield',
    '#title' => t('Type'),
    '#default_value' => isset($conf['type']) ? $conf['type'] : '',
    '#required' => TRUE,
  );

  $form['wrapper']['object'] = array(
    '#type' => 'textfield',
    '#title' => t('Object'),
    '#default_value' => isset($conf['object']) ? $conf['object'] : '',
    '#required' => TRUE,
  );

  $form['subs_list'] = array(
    '#markup' => sigma_ig_widget_content_type_subscription_list(),
  );

  $form += sigma_render_status();

  $path = drupal_get_path('module', 'sigma');
  $form['#attached']['js'][] = $path . '/js/client/socket.io.min.js';
  $form['#attached']['js'][] = $path . '/js/client/sigma.js';
  $form['#attached']['js'][] = $path . '/plugins/content_types/ig_widget/ig_widget.js';
  $form['#attached']['css'][] = $path . '/plugins/content_types/ig_widget/ig_widget.css';

  $sigma = Sigma::getInstance();
  $sigma->send_node_server_url();

  return $form;
}


/**
 * Renders subscription list table.
 */
function sigma_ig_widget_content_type_subscription_list() {
  $vars = array(
    'header' => array(
      '',
      t('Subscription ID'),
      t('Type'),
      t('Tag'),
    ),
    'rows' => array(
      array('<input type="radio" name="subscription_id"/>', '', '', ''),
    ),
    'attributes' => array('id' => 'subscription-list'),
  );
  $content = '<div id="subscription-list-container">' . theme('table', $vars) . '</div>';

  return $content;
}


/**
 * The submit form stores the data in $conf.
 */
function sigma_ig_widget_content_type_edit_form_submit($form, &$form_state) {
  foreach (array('id', 'type', 'object') as $key) {
    $form_state['conf'][$key] = check_plain($form_state['values'][$key]);
  }
}
