import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcrypt"

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";


export async function POST(request:Request){
    await dbConnect()

    try{
        const {username, email, password}= await Request.json();
        const existingUSerVerifiedByUsername = await UserModel.findOne({
          username,
          isVerified: true,
        });
        if(existingUSerVerifiedByUsername){
            return Response.json(
              {
                success: false,
                message: "Username is already taken",
              },
              { status: 400 }
            );
        }
        const existingUSerVerifiedByEmail = await UserModel.findOne({
          email,
          isVerified: true,
        });

        const verifyCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        if(existingUSerVerifiedByEmail){
          return Response.json(
            {
              success: false,
              message: "Email is already taken",
            },
            { status: 400 }
          );
        }
        else{
            const hashedPassword = await bcrypt.hash(password,10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);
            
            const newUser = new UserModel({
              username,
              email,
              password: hashedPassword,
              verifyCode,
              verifyCodeExpiry: expiryDate,
              isVerified: false,
              isAcceptingMessage: true,
              messages: [],
            });
            await newUser.save()
        }

        //send verification email
        const emailResponse = await sendVerificationEmail(
          email,
          username,
          verifyCode
        );

        if(!emailResponse.success){
            return Response.json({
                success: false,
                message: emailResponse.message
            }, { status: 500 });
        }
        return Response.json(
          {
            success: true,
            message: "User regstered successfully. Please verify you email",
          },
          { status: 201 }
        );
    }
    catch(error)
    {
        console.error("Error registering user", error);
        return Response.json(
          {
            success: false,
            message: "Error registering user",
          },
          { status: 500 }
        );
    }
}