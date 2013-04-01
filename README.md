DNI
===

Module requires installed Node.js server.

It is desirable that the server is configured to support web socket protocol (ws). Otherwise communication will be
performed in other methods: flash socket, JSONP polling, AJAX polling.

Web server and node server may run on any port, but these ports should be different.

Repository contains demo installation profile.

Module dependencies: ctools, page_manager, panels (included to installation profile).

Module should be configured after installation.

Module provides following interfaces:
  - General settings. Includes instagram client ID, instagram client secret, node server port configuration,
    managing subscriptions (admin/config/services/sigma).
  - List of online client (admin/config/services/sigma/clients).
  - Moderation interface (admin/config/services/sigma/moderation).

Module provides Instagram widget, implemented as a CTools content type (located at Widgets -> Instagram).

Widget has following settings:
  - Subscription ID;
  - Image size (depending on image size, image with appropriate resolution will be used;
    e.g thumbnail 150x150, low_resolution 306x306, standard_resolution 612x612);
  - Number of image columns;
  - Number of image rows;
  - Animation type (horizontal, vertical, random);
  - Border and background color.

Any page may contain any number of instagram widgets.
