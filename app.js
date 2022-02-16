const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ =require("lodash");
const app = express();


app.set("view engine","ejs"); 
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
  name:"Hit the + button to get started!"
});

const item3=new Item({
  name:"👈🏻 Hit this to delete an item!"
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items: [itemsSchema]
};

const List=mongoose.model("List",listSchema);


app.get("/", function(req, res){
  Item.find({},function(err,foundItems){ 
    if(foundItems.length===0){
          Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          } else {
            console.log("Success!");
          }
        });
        res.redirect("/"); 
    } else {
      res.render("list",{listTitle:"Today",newListItems:foundItems});
    }
  });
  

});

app.get("/:customListName",function(req,res){
  const customListName= _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){ 
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
  const listName=req.body.list; 
  const itemLength=itemName.length;
  const item=new Item({
    name:itemName
  });

    if(listName==="Today"){
      if(!itemLength===0){
        item.save();
      } else {
        console.log("No value entered!");
      }
      res.redirect("/");
    } else {
      List.findOne({name:listName},function(err, foundList){
        if(!itemLength===0){
          foundList.items.push(item);
          foundList.save();
        } else {
          console.log("No value entered!");
        }
        
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

let port=process.env.PORT;
if (port== null||port==""){
  port=3000;
}
app.listen(port, function(){
  console.log("Server started.");
});
