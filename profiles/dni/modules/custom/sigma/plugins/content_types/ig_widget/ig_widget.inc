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
  $block->content = '
<div class="sigma-widget" sigma-subsid="' . $conf['id']
  . '" sigma-size="' . $conf['size']
  . '" sigma-columns="' . (1 + $conf['columns'])
  . '" sigma-rows="' . (1 + $conf['rows'])
  . '" sigma-animation="' . $conf['animation']
  . '" sigma-color="#' . $conf['color'] . '">
  <div class="sigma-content"></div>
</div>';
  sigma_prepare_js();
  ctools_add_js('ig_widget', 'sigma', 'plugins/content_types/ig_widget');
  ctools_add_css('ig_widget', 'sigma', 'plugins/content_types/ig_widget');

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

  $form += sigma_render_status();

  $form['subs_list'] = array(
    '#markup' => sigma_ig_widget_content_type_subscription_list(),
  );

  $form['size'] = array(
    '#type' => 'textfield',
    '#title' => t('Image size'),
    '#default_value' => isset($conf['size']) ? $conf['size'] : 150,
    '#required' => TRUE,
    '#field_siffix' => 'px',
    '#size' => 4,
    '#maxlength' => 4,
  );

  $form['columns'] = array(
    '#type' => 'select',
    '#title' => t('Columns'),
    '#options' => range(1, 20),
    '#default_value' => isset($conf['columns']) ? $conf['columns'] : 3,
  );

  $form['rows'] = array(
    '#type' => 'select',
    '#title' => t('Rows'),
    '#options' => range(1, 20),
    '#default_value' => isset($conf['rows']) ? $conf['rows'] : 3,
  );

  $form['animation'] = array(
    '#type' => 'select',
    '#title' => t('Animation'),
    '#options' => array(
      'horizontal' => 'Horizontal',
      'vertical' => 'Vertical',
      'random' => 'Random',
    ),
    '#default_value' => isset($conf['animation']) ? $conf['animation'] : 0,
  );

  $form['color'] = array(
    '#type' => 'textfield',
    '#title' => t('Color'),
    '#default_value' => isset($conf['color']) ? $conf['color'] : '000000',
    '#required' => TRUE,
    '#field_prefix' => '#',
    '#size' => 6,
    '#maxlength' => 6,
  );

  sigma_prepare_js();
  ctools_add_js('ig_widget.admin', 'sigma', 'plugins/content_types/ig_widget');
  ctools_add_css('ig_widget.admin', 'sigma', 'plugins/content_types/ig_widget');

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
      t('Moderated'),
    ),
    'rows' => array(
      array('<input type="radio" name="subscription_id"/>', '', '', '', ''),
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
  foreach (array('id', 'type', 'object', 'size', 'columns', 'rows', 'animation', 'color') as $key) {
    $form_state['conf'][$key] = check_plain($form_state['values'][$key]);
  }
}
