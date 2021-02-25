import axios from 'axios';
import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import { saveUser, getUser } from '../../../lib/data'


const to = function to(promise) {
    return promise
        .then(data => [null, data]).catch(err => [(err)]);
};

const secret = 'BlackCat';



const providers = [
    Providers.Spotify({
        clientId: '75ff063399cf492199d40d630060fbce',
        clientSecret: 'a9b8d76f15ef497aa27b8596d9b372be',
        scope: 'user-read-private,user-read-email,user-follow-read,user-top-read'
    })
]

const callbacks = {}

callbacks.signIn = async function signIn(user, account, metadata) {

    const [err, bandsRes] = await to(axios('https://api.spotify.com/v1/me/top/artists?limit=50', {
        headers: {
            'Authorization': `Bearer ${account.access_token}`
        }
    }));

    if (err) console.error(err);
    else {
        const bands = bandsRes.data;
        user.bands = bands ? bands.items : [];        
    }

    const spotifyUser = {
        ...user
    }

    user.id = await saveUser('spotify', spotifyUser)
    return true;


}

callbacks.jwt = async function jwt(token, user) {
    if (user) {
        token = { id: user.id }
    }

    return token
}

callbacks.session = async function session(session, token) {
    const dbUser = await getUser(token.id)
    if (!dbUser) {
      return null
    }
    
    session.user = {
      id: dbUser.id,
      spotify: {
        bands: dbUser.spotify.bands,
        login: dbUser.spotify.login,
        name: dbUser.spotify.name
      }
    }
    
    return session
  }


const options = {
    providers,
    session: {
        jwt: true
    },
    jwt: {
        secret,
    },
    callbacks
}

export default (req, res) => NextAuth(req, res, options)
