const debug	= require( 'debug' );
const crypto	= require( 'crypto' );
const request	= require( 'request' );



/**
 *	getDefer
 *	@return {object} deferred
 */
function getDefer()
{
	const deferred = {};
	deferred.promise = new Promise( ( pfnResolve, pfnReject ) =>
	{
		deferred.resolve	= pfnResolve;
		deferred.reject		= pfnReject;
	});

	return deferred;
}


function escaper( sString )
{
	return encodeURIComponent( sString )
		.replace(/\*/g, '%2A')
		.replace(/'/g, '%27')
		.replace(/!/g, '%21')
		.replace(/"/g, '%22')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29')
		.replace(/\+/, '%2B');
}


function getSignature( oParams, sSecret, sMethod = 'get' )
{
	const sCanoQuery	= Object.keys( oParams ).sort().map(key => `${ escaper( key ) }=${ escaper( oParams[ key ] ) }`).join( '&' );
	const sStringToSign	= `${ sMethod.toUpperCase() }&${ escaper( '/' ) }&${ escaper( sCanoQuery ) }`;
	let sSignature		= crypto.createHmac( 'sha1', `${ sSecret }&` );
	sSignature		= sSignature.update( sStringToSign ).digest( 'base64' );

	//	...
	return escaper( sSignature );
}


/**
 *	send request
 *
 *	@param	{string}	sHost
 *	@param	{object}	oParams
 *	@param	{number|string}	nTimeout
 *	@return {Promise<any>}
 */
function sendRequest( sHost, oParams = {}, nTimeout = 5000 )
{
	let sMethod	= 'get';
	if ( oParams.method )
	{
		sMethod = oParams.method;
		delete oParams.method;
	}

	const sSecret	= oParams.AccessKeySecret;
	delete oParams.AccessKeySecret;

	oParams.SignatureNonce	= Math.random();
	oParams.Timestamp	= new Date().toISOString();

	const sSignature	= getSignature( oParams, sSecret, sMethod );
	const deferred		= getDefer();

	if ( 'get' === sMethod )
	{
		const sQuery	= Object.keys( oParams ).sort().map(sKey => `${ escaper( sKey ) }=${ escaper( oParams[ sKey ] ) }`).join( '&' );
		const sUrl	= `${ sHost }?${ sQuery }&Signature=${ sSignature }`;

		debug( 'dealiyun:common:url')( sUrl );

		request.get( sUrl, { timeout: parseInt( nTimeout, 10 ) }, ( err, res ) =>
		{
			if ( err )
			{
				deferred.reject( err );
			}

			try
			{
				deferred.resolve( JSON.parse( res.body ) );
			}
			catch ( e )
			{
				deferred.reject( err );
			}
		});
	}
	else
	{
		oParams.Signature = sSignature;
		debug( 'dealiyun:common:params' )( oParams );
		request
		({
			method	: sMethod.toUpperCase(),
			url	: sHost,
			headers	: [
				{
					name	: 'content-type',
					value	: 'application/x-www-form-urlencoded'
				}
			],
			timeout	: parseInt( nTimeout, 10 ),
			form	: oParams
		}, ( err, res ) =>
		{
			if ( err )
			{
				deferred.reject( err );
			}

			try
			{
				deferred.resolve( JSON.parse( res.body ) );
			}
			catch ( e )
			{
				deferred.reject( err );
			}
		});
	}

	//	...
	return deferred.promise;
}




/**
 *	@exports
 */
module.exports	= sendRequest;