import mongoose from "mongoose";
import  Validator  from "validator";
const schema=new mongoose.Schema(
    {
     _id:{
         type: String,
         required:[true,"Please enter Id"],
     },
     name:{
        type: String,
        required:[true,"Please enter Name"],
     },
     email:{
        type: String,
        unique:[true,"Email already exist"],
        required:[true,"Please enter Email"],
        lowercase:true,
        validate:validator._default.isEmail,
     },
     photo:{
        type: String,
         required:[true,"Please add Photo"],
     },
     role:{
        type: String,
         enum:["admin","user"],
         default:"user",
     },
     gender:{
        type: String,
         enum:["male","female"],
         required:[true,"Please enter Gender"],
     },
     dob:{
        type: Date,
        required:[true,"Please enter Date Of Birth"],
     },
     } ,
     {
    timestamps: true,
}
);
schema.virtual("age").get(function(){

});
export const User=mongoose.model("User",schema);
User.age=