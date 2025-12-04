let file1 = "https://codeberg.org/src48597962/hk/raw/branch/master/SrcJuying.js";

let relyfile = file1;

if(relyfile==""){
  let cjFile = request(file1,{timeout:3000});
  if(cjFile.indexOf('nowVersion') > -1){
    relyfile = file1;
  }else{
    let cjFile = request(file2,{timeout:3000});
    if(cjFile.indexOf('nowVersion') > -1){
      relyfile = file2;
    }else{
      relyfile = file3;
    }
  }
}
  
