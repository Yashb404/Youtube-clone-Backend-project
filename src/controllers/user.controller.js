import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { createAuthCookieOptions } from "../utils/authCookies.js"


const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken() 
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    }catch(error){
        if (error instanceof ApiError) {
            throw error
        }

        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
     

    const {fullname,email,username,password} = req.body
   // console.log("email",email);
   



    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const normalizedFullname = fullname.trim()
    const normalizedUsername = username.trim().toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()

    const existedUser = await User.findOne({
        $or:[{username: normalizedUsername},{email: normalizedEmail}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file required")
    }

    const user = await User.create({
        fullname: normalizedFullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: normalizedEmail,
        password,
        username: normalizedUsername
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while user creation")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully "))
        
})



const loginUser = asyncHandler(async(req,res)=>{
    const email = req.body?.email?.trim()?.toLowerCase()
    const username = req.body?.username?.trim()?.toLowerCase()
    const {password} = req.body
    
    if ((!username && !email) || !password) {
        throw new ApiError(400, "Username or email and password are required")
    }

    const identifier = username || email
   const user = await User.findOne({
    $or:[{username: identifier},{email: identifier}]
   })

   if(!user){
    throw new ApiError(404,"User doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken ")

    const accessCookieOptions = createAuthCookieOptions(process.env.ACCESS_TOKEN_EXPIRY)
    const refreshCookieOptions = createAuthCookieOptions(process.env.REFRESH_TOKEN_EXPIRY)

    return res.status(200).cookie("accessToken",
        accessToken,accessCookieOptions).cookie("refreshToken",refreshToken,refreshCookieOptions)
        .json(
            new ApiResponse(
                200,{
                    user:loggedInUser,accessToken,refreshToken
                },
                "User logged in succesfully"
            )
        )


})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new :true
        }
    )
    
    const accessCookieOptions = createAuthCookieOptions(process.env.ACCESS_TOKEN_EXPIRY)
    const refreshCookieOptions = createAuthCookieOptions(process.env.REFRESH_TOKEN_EXPIRY)
    return res.status(200)
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions)
    .json(new ApiResponse(200, {},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken


   if (!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }

   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
 
    const user = await User.findById(decodedToken?._id)
 
     if (!user){
     throw new ApiError(401,"unauthorized request")
    }
 
    if(incomingRefreshToken!==user?.refreshToken){
     throw new ApiError(401,"Expired refresh token")
    }
 
    const accessCookieOptions = createAuthCookieOptions(process.env.ACCESS_TOKEN_EXPIRY)
    const refreshCookieOptions = createAuthCookieOptions(process.env.REFRESH_TOKEN_EXPIRY)
 
    const {accessToken,refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,accessCookieOptions)
    .cookie("refreshToken",newRefreshToken,refreshCookieOptions)
    .json(
     new ApiResponse(
         200,
         {accessToken,refreshToken:newRefreshToken},
         "Access token refreshed"
     )
    )
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
   }

})

const changeCurrentUserPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Old password and new password are required")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"Password changed succesfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user fetched succesfully"))

})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields required")
    }

    const normalizedFullname = fullname.trim()
    const normalizedEmail = email.trim().toLowerCase()

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:normalizedFullname,
                email:normalizedEmail
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated succesfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is mising")
    }

    //delete old image todo

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar?.url) {
        throw new ApiError(400,"Error while uploading on avatar")     
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar image updated")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const CoverLocalPath = req.file?.path

    if(!CoverLocalPath){
        throw new ApiError(400,"Cover file is mising")
    }

    const coverImage = await uploadOnCloudinary(CoverLocalPath)

    if (!coverImage?.url) {
        throw new ApiError(400,"Error while uploading on cover image")     
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover image updated")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
        },
        {
            $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }

    ])
    
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")        
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField: "watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentUserPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,
    getUserChannelProfile,getWatchHistory}