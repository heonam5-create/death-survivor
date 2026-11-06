import glob
head=open('src/shell_head.html',encoding='utf-8').read()
js='\n'.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob('src/0*.js')))
open('index.html','w',encoding='utf-8').write(head+'<script>\n'+js+'\n</script>\n</body>\n</html>\n')
open('/tmp/g.js','w').write(js)
print('built', len(head)+len(js))
