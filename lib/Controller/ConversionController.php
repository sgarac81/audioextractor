<?php
namespace OCA\AudioExtractor\Controller;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use \OCP\IConfig;
use OCP\EventDispatcher\IEventDispatcher;
use OC\Files\Filesystem;


class ConversionController extends Controller {

	private $userId;

	/**
	* @NoAdminRequired
	*/
	public function __construct($AppName, IRequest $request, $UserId){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;

	}

	public function getFile($directory, $fileName){
		\OC_Util::tearDownFS();
		\OC_Util::setupFS($this->userId);
		return Filesystem::getLocalFile($directory . '/' . $fileName);
	}
	/**
	* @NoAdminRequired
	*/
	public function convertHere($nameOfFile, $directory, $external, $type, $vbitrate = null, $shareOwner = null, $mtime = 0) {
		$file = $this->getFile($directory, $nameOfFile);
		$dir = dirname($file);
		$response = array();
		if (file_exists($file)){
			$cmd = $this->createCmd($file, $type, $vbitrate);
			$output = "";
			exec($cmd, $output,$return);
			// if the file is un external storage
			if($external){
				//put the temporary file in the external storage
				Filesystem::file_put_contents($directory . '/' . pathinfo($nameOfFile)['filename'].".".$type, file_get_contents(dirname($file) . '/' . pathinfo($file)['filename'].".".$type));
				// check that the temporary file is not the same as the new file
				if(Filesystem::getLocalFile($directory . '/' . pathinfo($nameOfFile)['filename'].".".$type) != dirname($file) . '/' . pathinfo($file)['filename'].".".$type){
					unlink(dirname($file) . '/' . pathinfo($file)['filename'].".".$type);
				}
			}else{
				//create the new file in the NC filesystem
				Filesystem::touch($directory . '/' . pathinfo($file)['filename'].".".$type);
			}
			//if ffmpeg is throwing an error
			if($return == 127){
				$response = array_merge($response, array("cmd" => $cmd, "code" => 0, "desc" => "ffmpeg is not installed or available"));
				return json_encode($response);
			}else{
				$response = array_merge($response, array("cmd" => $cmd, "code" => 1));
				return json_encode($response);
			}
		}else{
			$response = array_merge($response, array("cmd" => $cmd, "code" => 0, "desc" => "Can't find file at ". $file));
			return json_encode($response);
		}
	}
	/**
	* @NoAdminRequired
	*/
	public function createCmd($file, $type, $vbitrate){
		$middleArgs = "";
		if ($type == "mp3") $middleArgs = "-ac 2 -vn -ab ".$vbitrate."K";
                else if ($type == "flac") $middleArgs = "-ac 2 -vn";
		else if ($type == "m4a") $middleArgs = "-ac 2 -vn -b:a ".$vbitrate."K";
		$cmd = " ffmpeg -y -i ".escapeshellarg($file)." ".$middleArgs." ".escapeshellarg(dirname($file) . '/' . pathinfo($file)['filename'].".".$type);
		return $cmd;
	}
}
