const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date=require(__dirname+"/date.js");
const _ =require("lodash");
const app = express();

// const items=[]; //global variable since used in post request
// const workItems=[];
app.set("view engine","ejs"); //always place it below const app=express(); wali line
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

main().catch(err => console.log(err)); 

async function main() {
  await mongoose.connect('mongodb+srv://admin-navsheel:test123@cluster0.qqbmw.mongodb.net/todolistDB');
}

const itemsSchema= new mongoose.Schema({
  name: String
});

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name: "Welcome to your todolist!"
});

const item2=new Item({
  name:"Hit the + button to get started."
});

const item3=new Item({
  name:"<-- Hit this delete an item."
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items: [itemsSchema]
};

const List=mongoose.model("List",listSchema);


app.get("/", function(req, res){
  Item.find({},function(err,foundItems){ //find se jo bhi items milenge for store honge foundItems mei which will be an array
    if(foundItems.length===0){
          Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          } else {
            console.log("Success!");
          }
        });
        res.redirect("/"); //when items are added if []=0 then when we redirect, it will enter app.get --> else block, rendering the list of items in the array
    } else {
      res.render("list",{listTitle:"Today",newListItems:foundItems});
    }
  });
  

});

app.get("/:customListName",function(req,res){
  const customListName= _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){ //here we just get an object bact which will be foundList, because it's findOne not find
    if(!err){
      if(!foundList){
        //Create a new list
        const list= new List({
          name: customListName,
          items: defaultItems
        });
        list.save(); 
        res.redirect("/"+customListName);     
      } else {
        //Show an existing list
        res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
      }
    } else {
      console.log(err);
    }
    
  });
  
});

app.post("/",function(req,res){
  
  const itemName=req.body.newitem;
  const listName=req.body.list; //value of the button name list which is the list title of specific list user entered
  const item=new Item({
    name:itemName
  });

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName},function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
  
});


app.post("/delete",function(req,res){
  const checkedItemId= req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today") {
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Successfully deleted!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
 
});



app.get("/about",function(req,res){
  res.render("about");
});


app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
