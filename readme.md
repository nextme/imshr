Image shrinker and optimizer
A tiny script that converts all images bigger than given value to smaller ones. Also it can optimize images in folder.

Сжатие и оптимизация изображений
Для запуска используется команда 
node index.js resize каталог      --  ддя изменения размеров
или
node index.js opt каталог      --  ддя изменения размеров


Таким образом, разница лишь в третьем слове команды -  либо resize, либо opt

Каталог указанный при запуске имеет приоритет над указанным в конфиге.
Качество оптимизации изображний и размер, до которого ужимаются изображения указываются в конфиге.