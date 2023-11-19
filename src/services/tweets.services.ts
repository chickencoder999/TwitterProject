import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.Schema'
import { ObjectId } from 'mongodb'

class tweetService {
  async createTweets({ user_id, body }: { user_id: string; body: TweetRequestBody }) {
    //lưu vào database
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: [],
        mentions: body.mentions,
        parent_id: body.parent_id,
        medias: body.medias,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    //return : kết quả là object có 2 thuộc tính {acknowledged : true, insertedId : <id>}
    //lấy id của tweet vừa tạo
    const tweet = await databaseService.tweets.findOne({
      _id: new ObjectId(result.insertedId)
    })
    return tweet
  }
}

const tweetsService = new tweetService()
export default tweetsService
