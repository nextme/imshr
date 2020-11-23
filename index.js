const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dt = require('dir-traverse');

const config = require('./config.js');

let writtenLayer = ""
let parents = []

const resizer = ({filename, isDirectory, layer, parent}) => {
  let bcstr = ""
  if(parent==null) parents = [];
  if(parent) {
    if(!parents.includes(parent)) {
      parents.push(parent);
      writtenLayer = layer;
    } else {
      while(writtenLayer>layer){
        parents.pop();
        writtenLayer--;
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
    console.log("Файл: "+filepathname)
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
        console.log(`Файл: ${filepathname} ${data.width}:${data.height} будет конвертирован`);
      }
      if(config.test==true) return;
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
    }).catch(e=>console.log(e));
  }
};

/**
 *  Optimize image
 *  
 * 
 */
const optimizer = ({filename, isDirectory, layer, parent}) => {
  console.log(filename,parent);
  return 0;
}

let arg,resize = false,opt = false;
if(process.argv[2]){
  arg = process.argv[2];
}
else{
  console.log('Режим не выбран. По умолчанию - изменение размера.')
  resize = true;
}
switch(process.argv[2]){
  case "opt":
    opt = true;
    break;

  case "resize":
  default:
    resize = true;
    break;
}
if(opt){
  console.log("Изменение размеров в папке: ",config.folder);
  dt(config.folder, {handler:optimizer, undefined, recursive: true});
}
if(resize){
  console.log("Оптимизация изображений в папке: ",config.folder);
  dt(config.folder, {handler:resizer, undefined, recursive: true});
}
