

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dt = require('dir-traverse');

const config = require('./config.js');

let writtenLayer = ""
let parents = []

const handler = ({filename, isDirectory, layer, parent}) => {
  let bcstr = ""
 
  if(parent) {
    if(!parents.includes(parent)) {
      parents.push(parent);
      writtenLayer = layer;
    } else {
      if(writtenLayer>layer){
        parents.pop();
      }
    }
  }

  // console.log(filename, isDirectory, layer, parent)
  // console.log(parents)
  
  for(let i=0;i<parents.length;i++){
    bcstr += parents[i]+'/';
  }
  // console.log(bcstr,writtenLayer,layer)
    if(isDirectory) return;
    
    let ext = filename.split('.')[1];
    ext = path.extname(filename).substring(1);
    // console.log("Ext: ",ext)
    if(ext && config.types.includes(ext) ){
      let filepath=path.join(__dirname,config.folder,bcstr)
      let filepathname=path.join(filepath,filename)
      // console.log("Файл: "+filepathname)
      let im;
      try {
        im  = sharp(filepathname);
      } catch (error) {
        console.error('Файл повреждён')
        console.error(error)
      }
      
      im.metadata().then(data=>{
        let newSize={};
        let needResize="";
        console.log(`Файл: ${filename} ${data.width}:${data.height}`);
        if(config.test==true) return;
        if(data.height>config.trigger_size){
          newSize.width = undefined
          newSize.height = config.new_size;
          needResize=true;
          
        }
        if(data.width>config.trigger_size){
          newSize.height = undefined
          newSize.width = config.new_size;
          needResize=true;
        }
        if(needResize){
          console.log("Конвертируем "+filename) 
            try {
              im
              .resize(newSize)
              .toFile(filepathname+".temp")
              .then(info => { 
                console.log(`Успешно конвертирован файл ${filename} ${info.width} ${info.height}`);
                
                if(config.delete_files==true){
                  fs.rmSync(filepathname)
                }
                else {
                  fs.renameSync(filepathname,filepathname+".bak")
                }
                fs.renameSync(filepathname+".temp",filepathname)
              })
              .catch(err => {
                console.log("-------Error------")
                console.log(err)
              });
            } catch (error) {
              console.error(error)
            }
        }
      });
  }
};
let dir = config.folder
console.log("Папка: ",dir)
dt(dir, {handler, undefined, recursive: true});
