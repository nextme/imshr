const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dt = require('dir-traverse');

const config = require('./config.js');
let folder = config.folder;
let writtenLayer = ""
let parents = []
let total=0;
/**
 * Returns an object with filepathname and extension for a given params   
 * @param {String} filename Filename to get pah from
 * @param {Boolean} isDirectory is it a folder
 * @param {Number} layer Depth layer of the file inside folders
 * @param {String} parent Name of the parent folder
 */
const getPath = (filename, isDirectory, layer, parent)=>{
  try {
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
    let ext = filename.split('.')[1];
    ext = path.extname(filename).substring(1);
    let filepath=path.join(__dirname,folder,bcstr)
    let filepathname=path.join(filepath,filename)
    return {filepathname,ext};
  } catch (error) {
    console.log(error)
  }
}
/**
 *  Resize images
 * @param {*} param0 
 */
const resizer = ({filename, isDirectory, layer, parent}) => {
  
  let {filepathname,ext} = getPath(filename, isDirectory, layer, parent)
  if(ext && config.types.includes(ext) ){
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
  // console.log("Файл: "+filename)
  if(!isDirectory) total++;
  
  
  let f = getPath(filename, isDirectory, layer, parent);
  
  let fp=f.filepathname
  let ext = f.ext
  console.log(f.filepathname||"!!!!!!!!!!!!!!!!!!1",f.ext||"Dir")
  // console.log(ext,config.types)
    if(ext && config.types.includes(ext) ){
      console.log("sharp: "+fp)
      try {
    
        let im = sharp(fp)
        .toFormat('jpeg', { progressive: true, quality: 50 })
        .toFile(fp+".temp")
        .then(info => { 
          console.log(`Успешно конвертирован файл ${fp}`);    
          if(config.delete_files==true){
            fs.rmSync(fp);
          }else{
            fs.renameSync(fp,fp+".bak")
          }    
          fs.renameSync(fp+".temp",fp)
        });
      } catch (error) {
        console.log(error)
  
      }
    }
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
if(process.argv[3]){
  folder = process.argv[3];
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
      if(resize){
        console.log("Изменение размеров в папке: ",folder);
        dt(folder, {handler:resizer, undefined, recursive: true});
      }
      if(opt){
        console.log("Оптимизация изображений в папке: ",folder);
        dt(folder, {handler:optimizer, undefined, recursive: true});
        console.log(total);
      }
      
      // console.error('Ошибка при открытии файла.')