exports.config =
  # See https://github.com/brunch/brunch/blob/stable/docs/config.md for documentation.
  files:
    javascripts:
      joinTo:
        'javascripts/app.js': /^app/
        'javascripts/vendor.js': /^vendor/
      order:
        before: [
          'vendor/scripts/console-helper.js',
          'vendor/scripts/jquery-1.10.2.js',
          'vendor/scripts/underscore-1.5.2.js',
          'vendor/scripts/backbone-1.0.0.js',
          'vendor/scripts/backbone-mediator.js',
        ]

    stylesheets:
      joinTo:
        'stylesheets/app.css': /^app|bootstrap\.less/

    templates:
      joinTo: 'javascripts/app.js'

  server:
    path: 'jst-server.coffee'
    run: yes
