#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var reactDocgen = require('react-docgen');
var ReactDocGenMarkdownRenderer = require('react-docgen-markdown-renderer');
var dir = require('node-dir');
var program = require('commander');
var renderer = null;
program
  .command('run')
  .option(
    '-f, --folder [folder]',
    'Path to the folder with all the component files in.'
  )
  .option('-o, --output [output]', 'Path for the output')
  .action(function(options) {
    let outputPath = options.output || './documentation.md';
    let folderPath = options.folder || './src';
    
    renderer = new ReactDocGenMarkdownRenderer({
      componentsBasePath: folderPath,
      remoteComponentsBasePath: folderPath,
    });

    handleExtraction(folderPath, outputPath);
    return 1;
  });

program.parse(process.argv);

function handleExtraction(path, outputPath) {
  var folders = [path];
  var componentsOutput = [];
  var totalContent = '';

  function readFolder(folder) {
    dir.readFiles(
      folder,
      { match: /.(js|jsx)$/ },
      (err, content, dirPath, next) => {
        if (err) throw err;

        try {
          const docs = reactDocgen.parse(
            content,
            reactDocgen.resolver.findAllComponentDefinitions
          );
          docs.forEach(doc => {
            let annotationSplits = doc.description.split('@');

            annotationSplits.forEach(annotation => {
              let afw = annotation.split(' ')[0];
              if (afw)
                doc[afw] = annotation.replace(afw + ' ', ''); 
            });
            
            componentsOutput.push({
              name: JSON.stringify(doc.displayName),
              value: renderer.render(dirPath, doc, []),
            });
            
            
          });
        } catch (e) {
          // console.log(e)
        }

        next();
      },
      function(err, files) {
        if (err) throw err;

        componentsOutput.sort(function(a, b) {
          return a.name == b.name ? 0 : a.name > b.name ? 1 : -1;
        });

        componentsOutput.forEach(componentData => {
          if (componentData.value) {
            totalContent += componentData.value;
          }
        });

        console.log('==================================================================================');
        console.log('>> Found ' + componentsOutput.length + ' components, and build documentation at ' + outputPath);
        console.log('==================================================================================');

        fs.writeFile(outputPath, totalContent, () => {});
      }
    );
  }

  folders.forEach(readFolder);
}
