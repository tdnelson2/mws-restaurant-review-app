/*
 After you have changed the settings under responsive_images
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {
  const quality = 30;
  const suffix = 'w';
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [
            { width: 230, quality, suffix },
            { width: 254, quality, suffix },
            { width: 261, quality, suffix },
            { width: 312, quality, suffix },
            { width: 326, quality, suffix },
            { width: 341, quality, suffix },
            { width: 345, quality, suffix },
            { width: 360, quality, suffix },
            { width: 372, quality, suffix },
            { width: 425, quality, suffix },
            { width: 455, quality, suffix },
            { width: 460, quality, suffix },
            { width: 498, quality, suffix },
            { width: 508, quality, suffix },
            { width: 522, quality, suffix },
            { width: 539, quality, suffix },
            { width: 584, quality, suffix },
            { width: 615, quality, suffix },
            { width: 624, quality, suffix },
            { width: 652, quality, suffix },
            { width: 682, quality, suffix },
            { width: 690, quality, suffix },
            { width: 720, quality, suffix },
            { width: 744, quality, suffix },
            { width: 850, quality, suffix },
            { width: 910, quality, suffix },
            { width: 996, quality, suffix },
            { width: 1078, quality, suffix },
            { width: 1168, quality, suffix },
            { width: 1230, quality, suffix },]
        },

        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'img/'
        }]
      }
    },

    /* Add a placeholder image */
    copy: {
      main: {
        expand: true,
        cwd: 'img_src',
        src: 'na.svg',
        dest: 'img/',
      },
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img']
        },
      },
    },

  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images', 'copy']);

};
