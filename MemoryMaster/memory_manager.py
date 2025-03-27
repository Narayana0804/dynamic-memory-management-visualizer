import random
import logging
from collections import deque

class MemoryManager:
    """Class to manage memory allocation and tracking for visualization"""
    
    def __init__(self, technique='paging', memory_size=1024, page_size=64, algorithm='FIFO'):
        """
        Initialize the memory manager with the specified parameters
        
        Args:
            technique (str): Memory management technique ('paging' or 'segmentation')
            memory_size (int): Total size of memory in bytes
            page_size (int): Size of each page/frame in bytes (for paging)
            algorithm (str): Page replacement algorithm ('FIFO' or 'LRU')
        """
        self.technique = technique
        self.memory_size = memory_size
        self.page_size = page_size
        self.algorithm = algorithm
        
        # Calculate total number of frames/pages
        self.total_frames = memory_size // page_size
        
        # Initialize memory structures
        self.memory = [{'status': 'free', 'id': None} for _ in range(self.total_frames)]
        self.page_table = {}  # Maps page ID to frame number
        
        # For page replacement algorithms
        self.page_queue = deque()  # For FIFO
        self.page_access_time = {}  # For LRU
        
        # Performance metrics
        self.page_faults = 0
        self.memory_accesses = 0
        self.page_hits = 0
        
        # Operation history
        self.operations = []
        
        # Next process/page ID (incremental)
        self.next_id = 1
        
        
        logging.basicConfig(
        filename="memory_manager.log",
        level=logging.DEBUG,
        format="%(asctime)s - %(levelname)s - %(message)s"
        )
        logging.debug(f"Memory Manager initialized with {technique}, size: {memory_size}, page size: {page_size}, algorithm: {algorithm}")


    
    def allocate_memory(self, size):
        """
        Allocate memory of specified size
        
        Args:
            size (int): Size of memory to allocate in bytes
        
        Returns:
            int: Starting address of allocated memory
        """
        # Calculate number of pages/frames needed
        num_pages_needed = (size + self.page_size - 1) // self.page_size
        
        if num_pages_needed > self.total_frames:
            raise ValueError(f"Requested size {size} exceeds total memory size {self.memory_size}")
        
        # Find free frames
        free_frames = [i for i, frame in enumerate(self.memory) if frame['status'] == 'free']
        
        # If not enough free frames, perform page replacement
        if len(free_frames) < num_pages_needed:
            frames_to_replace = num_pages_needed - len(free_frames)
            self._replace_pages(frames_to_replace)
            # Update free frames list
            free_frames = [i for i, frame in enumerate(self.memory) if frame['status'] == 'free']
        
        # Allocate memory
        process_id = self.next_id
        self.next_id += 1
        
        allocated_frames = free_frames[:num_pages_needed]
        
        for frame_idx in allocated_frames:
            self.memory[frame_idx] = {
                'status': 'allocated',
                'id': process_id
            }
            self.page_table[process_id] = allocated_frames
            
            # Update page replacement data structures
            if self.algorithm == 'FIFO':
                self.page_queue.append((process_id, frame_idx))
            elif self.algorithm == 'LRU':
                self.page_access_time[(process_id, frame_idx)] = self.memory_accesses
            
        self.operations.append({
            'type': 'allocate',
            'process_id': process_id,
            'size': size,
            'frames': allocated_frames
        })
        
        logging.debug(f"Allocated {size} bytes ({num_pages_needed} pages) for process {process_id} in frames {allocated_frames}")
        
        # Return the starting frame number as the "address"
        return allocated_frames[0] * self.page_size
    
    def deallocate_memory(self, address):
        """
        Deallocate memory at specified address
        
        Args:
            address (int): Starting address of memory to deallocate
        """
        # Input validation
        if address is None:
            raise ValueError("Address cannot be None")
        
        try:
            address = int(address)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid address format: {address}")
        
        # Convert address to frame number
        frame_num = address // self.page_size
        
        if frame_num >= len(self.memory) or frame_num < 0:
            raise ValueError(f"Invalid address: {address} (frame {frame_num} out of bounds)")
        
        frame = self.memory[frame_num]
        
        # Check if the frame is allocated
        if frame['status'] != 'allocated':
            # Look for any allocated memory and deallocate the first one found
            allocated_frames = [(i, f) for i, f in enumerate(self.memory) if f['status'] == 'allocated']
            
            if not allocated_frames:
                raise ValueError("No allocated memory to deallocate")
            
            # Use the first allocated frame instead
            frame_num = allocated_frames[0][0]
            frame = allocated_frames[0][1]
            logging.warning(f"No allocated memory at address {address}, using frame {frame_num} instead")
        
        process_id = frame['id']
        if process_id is None:
            raise ValueError(f"No process ID associated with frame {frame_num}")
        
        # Find all frames for this process
        process_frames = self.page_table.get(process_id, [])
        if not process_frames:
            # Just free this single frame if we can't find its process frames
            process_frames = [frame_num]
            logging.warning(f"No frames found for process {process_id} in page table, only freeing frame {frame_num}")
        
        # Free all frames
        for frame_idx in process_frames:
            if 0 <= frame_idx < len(self.memory):  # Safety check
                self.memory[frame_idx] = {'status': 'free', 'id': None}
                
                # Remove from page replacement data structures
                if self.algorithm == 'FIFO':
                    self.page_queue = deque([p for p in self.page_queue if p[0] != process_id])
                elif self.algorithm == 'LRU':
                    keys_to_remove = [(pid, fidx) for (pid, fidx) in self.page_access_time.keys() if pid == process_id]
                    for key in keys_to_remove:
                        if key in self.page_access_time:
                            del self.page_access_time[key]
        
        # Remove from page table
        if process_id in self.page_table:
            del self.page_table[process_id]
        
        # Update address to match the actual frame we deallocated
        actual_address = frame_num * self.page_size
        
        self.operations.append({
            'type': 'deallocate',
            'process_id': process_id,
            'address': actual_address,
            'frames': process_frames
        })
        
        logging.debug(f"Deallocated memory for process {process_id} from frames {process_frames}")
    
    def access_memory(self, address):
        """
        Simulate memory access at specified address
        
        Args:
            address (int): Memory address to access
        
        Returns:
            bool: True if page hit, False if page fault
        """
        # Input validation
        if address is None:
            raise ValueError("Address cannot be None")
        
        try:
            address = int(address)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid address format: {address}")
        
        # Convert address to frame number
        frame_num = address // self.page_size
        
        if frame_num >= len(self.memory) or frame_num < 0:
            # Instead of raising error, choose a valid frame
            logging.warning(f"Invalid address: {address}, choosing a valid frame instead")
            frame_num = min(max(0, frame_num), len(self.memory) - 1)
        
        self.memory_accesses += 1
        frame = self.memory[frame_num]
        
        if frame['status'] != 'allocated':
            # Page fault
            self.page_faults += 1
            
            # Allocate a page if using virtual memory simulation
            try:
                self._handle_page_fault(frame_num)
            except Exception as e:
                logging.error(f"Error handling page fault: {e}")
            
            self.operations.append({
                'type': 'access',
                'address': address,
                'result': 'fault'
            })
            
            logging.debug(f"Page fault on address {address} (frame {frame_num})")
            return False
        else:
            # Page hit
            self.page_hits += 1
            process_id = frame['id']
            
            # Update LRU data
            if self.algorithm == 'LRU':
                self.page_access_time[(process_id, frame_num)] = self.memory_accesses
            
            self.operations.append({
                'type': 'access',
                'address': address,
                'result': 'hit'
            })
            
            logging.debug(f"Page hit on address {address} (frame {frame_num})")
            return True
    
    def _replace_pages(self, num_pages):
        """
        Replace pages according to the selected algorithm
        
        Args:
            num_pages (int): Number of pages to replace
        """
        try:
            # Input validation
            if num_pages <= 0:
                logging.warning(f"Invalid number of pages to replace: {num_pages}")
                return
                
            for _ in range(num_pages):
                # Default values in case algorithm-specific code fails
                process_id = None
                frame_idx = None
                
                try:
                    if self.algorithm == 'FIFO':
                        if not self.page_queue:
                            # If no pages in queue, find any allocated frame
                            allocated_frames = [(i, f['id']) for i, f in enumerate(self.memory) 
                                               if f['status'] == 'allocated']
                            
                            if not allocated_frames:
                                logging.warning("No allocated frames to replace with FIFO")
                                break
                                
                            frame_idx, process_id = allocated_frames[0]
                            logging.warning(f"Page queue empty, using first allocated frame {frame_idx}")
                        else:
                            # Normal FIFO operation
                            process_id, frame_idx = self.page_queue.popleft()
                        
                    elif self.algorithm == 'LRU':
                        if not self.page_access_time:
                            # If no access times, find any allocated frame
                            allocated_frames = [(i, f['id']) for i, f in enumerate(self.memory) 
                                               if f['status'] == 'allocated']
                            
                            if not allocated_frames:
                                logging.warning("No allocated frames to replace with LRU")
                                break
                                
                            frame_idx, process_id = allocated_frames[0]
                            logging.warning(f"Access time map empty, using first allocated frame {frame_idx}")
                        else:
                            # Normal LRU operation
                            lru_key = min(self.page_access_time.items(), key=lambda x: x[1])[0]
                            process_id, frame_idx = lru_key
                            del self.page_access_time[lru_key]
                    else:
                        # Unknown algorithm fallback
                        allocated_frames = [(i, f['id']) for i, f in enumerate(self.memory) 
                                           if f['status'] == 'allocated']
                        
                        if not allocated_frames:
                            logging.warning(f"Unknown algorithm {self.algorithm} and no allocated frames")
                            break
                            
                        frame_idx, process_id = allocated_frames[0]
                        logging.warning(f"Unknown algorithm {self.algorithm}, using first allocated frame {frame_idx}")
                    
                    # Safety check for frame_idx and process_id
                    if frame_idx is None or process_id is None:
                        logging.error("Failed to select a page for replacement")
                        continue
                        
                    if frame_idx >= len(self.memory) or frame_idx < 0:
                        logging.error(f"Invalid frame index {frame_idx}")
                        continue
                    
                    # Free the frame
                    self.memory[frame_idx] = {'status': 'free', 'id': None}
                    
                    # Update page table
                    if process_id in self.page_table:
                        self.page_table[process_id] = [f for f in self.page_table[process_id] if f != frame_idx]
                        if not self.page_table[process_id]:
                            del self.page_table[process_id]
                    
                    self.page_faults += 1
                    
                    logging.debug(f"Replaced page in frame {frame_idx} for process {process_id} using {self.algorithm}")
                    
                except Exception as e:
                    logging.error(f"Error replacing page: {e}")
                    continue
                    
        except Exception as e:
            logging.error(f"Error in page replacement: {e}")
    
    def _handle_page_fault(self, frame_num):
        """
        Handle a page fault at the specified frame
        
        Args:
            frame_num (int): Frame number where the fault occurred
        """
        # In a real system, this would load from disk
        # For simulation, we'll just mark it as allocated
        
        # If the frame is already allocated, we don't need to do anything
        if self.memory[frame_num]['status'] == 'allocated':
            return
        
        # If the frame is free, allocate it
        if self.memory[frame_num]['status'] == 'free':
            process_id = self.next_id
            self.next_id += 1
            
            self.memory[frame_num] = {
                'status': 'allocated',
                'id': process_id
            }
            
            if process_id in self.page_table:
                self.page_table[process_id].append(frame_num)
            else:
                self.page_table[process_id] = [frame_num]
            
            # Update page replacement data structures
            if self.algorithm == 'FIFO':
                self.page_queue.append((process_id, frame_num))
            elif self.algorithm == 'LRU':
                self.page_access_time[(process_id, frame_num)] = self.memory_accesses
            
            logging.debug(f"Handled page fault by allocating frame {frame_num} to process {process_id}")
        else:
            # This shouldn't happen
            logging.error(f"Unexpected frame status in handle_page_fault: {self.memory[frame_num]['status']}")
    
    def get_current_state(self):
        """
        Get the current memory state
        
        Returns:
            dict: Current memory state
        """
        return {
            'technique': self.technique,
            'memory_size': self.memory_size,
            'page_size': self.page_size,
            'algorithm': self.algorithm,
            'total_frames': self.total_frames,
            'memory': self.memory,
            'page_table': self.page_table,
            'page_faults': self.page_faults,
            'memory_accesses': self.memory_accesses,
            'page_hits': self.page_hits,
            'operations': self.operations[-10:] if self.operations else []  # Return last 10 operations
        }
    
    def get_results(self):
        """
        Get the simulation results
        
        Returns:
            dict: Simulation results and analytics
        """
        hit_ratio = self.page_hits / max(1, self.memory_accesses) if self.memory_accesses > 0 else 0
        miss_ratio = self.page_faults / max(1, self.memory_accesses) if self.memory_accesses > 0 else 0
        
        allocated_frames = sum(1 for frame in self.memory if frame['status'] == 'allocated')
        utilization = allocated_frames / self.total_frames if self.total_frames > 0 else 0
        
        return {
            'page_faults': self.page_faults,
            'memory_accesses': self.memory_accesses,
            'page_hits': self.page_hits,
            'hit_ratio': hit_ratio,
            'miss_ratio': miss_ratio,
            'memory_utilization': utilization,
            'allocated_frames': allocated_frames,
            'total_frames': self.total_frames
        }
